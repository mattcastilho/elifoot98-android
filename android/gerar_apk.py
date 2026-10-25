"""Monta um APK minimo (WebView em tela cheia, retrato) sem o Android SDK.

Gera a mao: classes.dex (formato DEX 035), AndroidManifest.xml binario (AXML), e empacota com o jogo em assets/index.html.
A assinatura v1 (JAR) e feita depois com jarsigner. targetSdk 29: Android 7 a 15 aceitam APK so com assinatura v1.
O icone.png ao lado deste script (gerado por gerar_icone.py) vira o icone do app (resources.arsc gerado a mao).
Uso: python3 gerar_apk.py jogo.html saida-sem-assinatura.apk
"""
import hashlib, os, struct, sys, zipfile, zlib

PKG = "br.elifoot.novo"
CLASSE = "L" + PKG.replace(".", "/") + "/Main;"
URL = "file:///android_asset/index.html"


# ------------------------------------------------------------------ utilidades
def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def alinhar(buf, a):
    while len(buf) % a:
        buf.append(0)


# ------------------------------------------------------------------ DEX
def gerar_dex():
    T_ACT, T_CTX, T_BUN, T_VIEW, T_WS, T_WV, T_MAIN, T_STR = (
        "Landroid/app/Activity;", "Landroid/content/Context;", "Landroid/os/Bundle;", "Landroid/view/View;",
        "Landroid/webkit/WebSettings;", "Landroid/webkit/WebView;", CLASSE, "Ljava/lang/String;")
    tipos_desc = [T_ACT, T_CTX, T_BUN, T_VIEW, T_WS, T_WV, T_MAIN, T_STR, "V", "Z"]
    # prototipos: (shorty, retorno, [params])
    protos_def = {
        "V": ("V", "V", []),
        "V_Bundle": ("VL", "V", [T_BUN]),
        "V_Context": ("VL", "V", [T_CTX]),
        "V_String": ("VL", "V", [T_STR]),
        "V_View": ("VL", "V", [T_VIEW]),
        "V_Z": ("VZ", "V", ["Z"]),
        "WS": ("L", T_WS, []),
    }
    metodos_def = {
        "act_init": (T_ACT, "<init>", "V"),
        "act_onCreate": (T_ACT, "onCreate", "V_Bundle"),
        "act_setContentView": (T_ACT, "setContentView", "V_View"),
        "main_init": (T_MAIN, "<init>", "V"),
        "main_onCreate": (T_MAIN, "onCreate", "V_Bundle"),
        "ws_js": (T_WS, "setJavaScriptEnabled", "V_Z"),
        "ws_dom": (T_WS, "setDomStorageEnabled", "V_Z"),
        "ws_file": (T_WS, "setAllowFileAccess", "V_Z"),
        "ws_zoom": (T_WS, "setTextZoom", None),
        "wv_init": (T_WV, "<init>", "V_Context"),
        "wv_settings": (T_WV, "getSettings", "WS"),
        "wv_load": (T_WV, "loadUrl", "V_String"),
    }
    protos_def["V_I"] = ("VI", "V", ["I"])
    metodos_def["ws_zoom"] = (T_WS, "setTextZoom", "V_I")
    tipos_desc.append("I")

    strings = set(tipos_desc)
    for s, r, ps in protos_def.values():
        strings.add(s)
    for c, n, p in metodos_def.values():
        strings.add(n)
    strings.add(URL)
    strings = sorted(strings, key=lambda s: s.encode("utf-16-be"))
    sidx = {s: i for i, s in enumerate(strings)}
    tipos = sorted(set(tipos_desc), key=lambda t: sidx[t])
    tidx = {t: i for i, t in enumerate(tipos)}

    def chave_proto(k):
        s, r, ps = protos_def[k]
        return (tidx[r], [tidx[p] for p in ps])
    protos = sorted(protos_def, key=chave_proto)
    pidx = {k: i for i, k in enumerate(protos)}

    def chave_met(k):
        c, n, p = metodos_def[k]
        return (tidx[c], sidx[n], pidx[p])
    metodos = sorted(metodos_def, key=chave_met)
    midx = {k: i for i, k in enumerate(metodos)}

    # ---- codigo
    def code_item(regs, ins, outs, insns):
        b = struct.pack("<HHHHII", regs, ins, outs, 0, 0, len(insns))
        return b + b"".join(struct.pack("<H", w) for w in insns)

    init_code = code_item(1, 1, 1, [0x1070, midx["act_init"], 0x0000, 0x000E])
    # v0 webview, v1 settings/url, v2 const, v3 = this (p0), v4 = bundle (p1)
    on_create = [
        0x206F, midx["act_onCreate"], 0x0043,          # invoke-super {v3, v4}
        0x0022, tidx[T_WV],                             # new-instance v0, WebView
        0x2070, midx["wv_init"], 0x0030,                # invoke-direct {v0, v3}
        0x106E, midx["wv_settings"], 0x0000,            # invoke-virtual {v0}
        0x010C,                                         # move-result-object v1
        0x1212,                                         # const/4 v2, 1
        0x206E, midx["ws_js"], 0x0021,                  # {v1, v2}
        0x206E, midx["ws_dom"], 0x0021,
        0x206E, midx["ws_file"], 0x0021,
        0x0213, 100,                                    # const/16 v2, 100
        0x206E, midx["ws_zoom"], 0x0021,                # setTextZoom(100): ignora a escala de fonte do sistema
        0x011A, sidx[URL],                              # const-string v1, URL
        0x206E, midx["wv_load"], 0x0010,                # loadUrl {v0, v1}
        0x206E, midx["act_setContentView"], 0x0003,     # {v3, v0}
        0x000E,
    ]
    oncreate_code = code_item(5, 2, 2, on_create)

    # ---- layout
    n_str, n_tipo, n_proto, n_met = len(strings), len(tipos), len(protos), len(metodos)
    off = 0x70
    off_str = off; off += 4 * n_str
    off_tipo = off; off += 4 * n_tipo
    off_proto = off; off += 12 * n_proto
    off_met = off; off += 8 * n_met
    off_class = off; off += 32
    data_off = off

    data = bytearray()
    def pos():
        return data_off + len(data)
    # code items (alinhados a 4)
    alinhar_data = lambda a: [data.append(0) for _ in range((-pos()) % a)]
    alinhar_data(4)
    off_init = pos(); data += init_code
    alinhar_data(4)
    off_oncreate = pos(); data += oncreate_code
    n_code = 2
    # type lists
    tl_off = {}
    tls = []
    for k in protos:
        ps = protos_def[k][2]
        if ps and tuple(ps) not in tl_off:
            alinhar_data(4)
            tl_off[tuple(ps)] = pos()
            tls.append(ps)
            data += struct.pack("<I", len(ps)) + b"".join(struct.pack("<H", tidx[p]) for p in ps)
    off_tl_first = min(tl_off.values())
    # string data
    sd_off = []
    off_sd_first = pos()
    for s in strings:
        sd_off.append(pos())
        data += uleb(len(s.encode("utf-16-le")) // 2) + s.encode("utf-8") + b"\0"
    # class data
    off_cd = pos()
    data += uleb(0) + uleb(0) + uleb(1) + uleb(1)
    data += uleb(midx["main_init"]) + uleb(0x10001) + uleb(off_init)
    data += uleb(midx["main_onCreate"]) + uleb(0x1) + uleb(off_oncreate)
    # map
    alinhar_data(4)
    off_map = pos()
    mapa = [(0x0000, 1, 0), (0x0001, n_str, off_str), (0x0002, n_tipo, off_tipo), (0x0003, n_proto, off_proto),
            (0x0005, n_met, off_met), (0x0006, 1, off_class), (0x2001, n_code, off_init), (0x1001, len(tls), off_tl_first),
            (0x2002, n_str, off_sd_first), (0x2000, 1, off_cd), (0x1000, 1, off_map)]
    mapa.sort(key=lambda e: e[2])
    data += struct.pack("<I", len(mapa)) + b"".join(struct.pack("<HHII", t, 0, n, o) for t, n, o in mapa)

    tam = data_off + len(data)
    corpo = bytearray()
    corpo += b"".join(struct.pack("<I", o) for o in sd_off)
    corpo += b"".join(struct.pack("<I", sidx[t]) for t in tipos)
    for k in protos:
        s, r, ps = protos_def[k]
        corpo += struct.pack("<III", sidx[s], tidx[r], tl_off[tuple(ps)] if ps else 0)
    for k in metodos:
        c, n, p = metodos_def[k]
        corpo += struct.pack("<HHI", tidx[c], pidx[p], sidx[n])
    corpo += struct.pack("<IIIIIIII", tidx[T_MAIN], 0x1, tidx[T_ACT], 0, 0xFFFFFFFF, 0, off_cd, 0)
    assert 0x70 + len(corpo) == data_off

    cab = bytearray(b"dex\n035\0") + bytes(4 + 20)
    cab += struct.pack("<IIIII", tam, 0x70, 0x12345678, 0, 0)
    cab += struct.pack("<I", off_map)
    cab += struct.pack("<II", n_str, off_str) + struct.pack("<II", n_tipo, off_tipo) + struct.pack("<II", n_proto, off_proto)
    cab += struct.pack("<II", 0, 0) + struct.pack("<II", n_met, off_met) + struct.pack("<II", 1, off_class)
    cab += struct.pack("<II", len(data), data_off)
    assert len(cab) == 0x70
    dex = bytearray(cab + corpo + data)
    dex[12:32] = hashlib.sha1(dex[32:]).digest()
    dex[8:12] = struct.pack("<I", zlib.adler32(bytes(dex[12:])) & 0xFFFFFFFF)
    return bytes(dex)


# ------------------------------------------------------------------ AndroidManifest binario
ANDROID_NS = "http://schemas.android.com/apk/res/android"
ATTR_ID = {"label": 0x01010001, "name": 0x01010003, "exported": 0x01010010, "screenOrientation": 0x0101001E,
           "configChanges": 0x0101001F, "minSdkVersion": 0x0101020C, "versionCode": 0x0101021B,
           "versionName": 0x0101021C, "targetSdkVersion": 0x01010270, "hardwareAccelerated": 0x010102D3,
           "theme": 0x01010000, "icon": 0x01010002}
TYPE_REF, TYPE_STRING, TYPE_DEC, TYPE_HEX, TYPE_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12

ID_ICONE = 0x7F010000          # pacote 0x7f, tipo 1 (drawable), entrada 0
ICONE_APK = "res/drawable-nodpi-v4/icone.png"


def pool_strings(strs):
    dados, offs = bytearray(), []
    for s in strs:
        offs.append(len(dados))
        u = s.encode("utf-16-le")
        dados += struct.pack("<H", len(u) // 2) + u + b"\0\0"
    alinhar(dados, 4)
    inicio = 28 + 4 * len(strs)
    return struct.pack("<HHIIIIII", 0x0001, 28, inicio + len(dados), len(strs), 0, 0, inicio, 0) + \
        b"".join(struct.pack("<I", o) for o in offs) + bytes(dados)


def gerar_recursos():
    """resources.arsc com um unico recurso: drawable/icone (densidade nodpi) -> ICONE_APK."""
    valores = pool_strings([ICONE_APK])
    tipos, chaves = pool_strings(["drawable"]), pool_strings(["icone"])
    spec = struct.pack("<HHIBBHI", 0x0202, 16, 20, 1, 0, 0, 1) + struct.pack("<I", 0x0100)
    config = bytearray(64)
    struct.pack_into("<I", config, 0, 64)
    struct.pack_into("<H", config, 14, 0xFFFF)          # density = nodpi
    cab_tipo = 20 + 64
    entrada = struct.pack("<HHI", 8, 0, 0) + struct.pack("<HBBI", 8, 0, 0x03, 0)
    tipo = struct.pack("<HHIBBHII", 0x0201, cab_tipo, cab_tipo + 4 + len(entrada), 1, 0, 0, 1, cab_tipo + 4) + \
        bytes(config) + struct.pack("<I", 0) + entrada
    nome = "br.elifoot.novo".encode("utf-16-le").ljust(256, b"\0")
    cab_pac = 288
    corpo = tipos + chaves + spec + tipo
    pacote = struct.pack("<HHII", 0x0200, cab_pac, cab_pac + len(corpo), 0x7F) + nome + \
        struct.pack("<IIIII", cab_pac, 1, cab_pac + len(tipos), 1, 0) + corpo
    tudo = valores + pacote
    return struct.pack("<HHII", 0x0002, 12, 12 + len(tudo), 1) + tudo


MANIFESTO = ("manifest", [(None, "package", TYPE_STRING, PKG), ("a", "versionCode", TYPE_DEC, 6), ("a", "versionName", TYPE_STRING, "2.4")], [
    ("uses-sdk", [("a", "minSdkVersion", TYPE_DEC, 21), ("a", "targetSdkVersion", TYPE_DEC, 29)], []),
    ("application", [("a", "label", TYPE_STRING, "Elifoot Novo"), ("a", "icon", TYPE_REF, ID_ICONE), ("a", "theme", TYPE_REF, 0x01030006),
                     ("a", "hardwareAccelerated", TYPE_BOOL, True)], [
        ("activity", [("a", "name", TYPE_STRING, PKG + ".Main"), ("a", "label", TYPE_STRING, "Elifoot Novo"),
                      ("a", "icon", TYPE_REF, ID_ICONE),
                      ("a", "screenOrientation", TYPE_DEC, 1), ("a", "configChanges", TYPE_HEX, 0x4A0),
                      ("a", "exported", TYPE_BOOL, True)], [
            ("intent-filter", [], [
                ("action", [("a", "name", TYPE_STRING, "android.intent.action.MAIN")], []),
                ("category", [("a", "name", TYPE_STRING, "android.intent.category.LAUNCHER")], []),
            ]),
        ]),
    ]),
])


def gerar_manifesto():
    # strings: primeiro os nomes de atributo com id (na mesma ordem do resource map), depois o resto
    attr_nomes, outras = [], []
    def coletar(no):
        tag, attrs, filhos = no
        for ns, nome, tp, val in attrs:
            if ns and nome not in attr_nomes:
                attr_nomes.append(nome)
            elif not ns and nome not in outras:
                outras.append(nome)
            if tp == TYPE_STRING and val not in outras:
                outras.append(val)
        if tag not in outras:
            outras.append(tag)
        for f in filhos:
            coletar(f)
    coletar(MANIFESTO)
    for s in ("android", ANDROID_NS):
        if s not in outras:
            outras.append(s)
    strs = attr_nomes + [s for s in outras if s not in attr_nomes]
    si = {s: i for i, s in enumerate(strs)}

    # string pool (UTF-16)
    dados, offs = bytearray(), []
    for s in strs:
        offs.append(len(dados))
        u = s.encode("utf-16-le")
        dados += struct.pack("<H", len(u) // 2) + u + b"\0\0"
    alinhar(dados, 4)
    hdr = 28
    inicio = hdr + 4 * len(strs)
    pool = struct.pack("<HHIIIIII", 0x0001, hdr, inicio + len(dados), len(strs), 0, 0, inicio, 0)
    pool += b"".join(struct.pack("<I", o) for o in offs) + dados
    resmap = struct.pack("<HHI", 0x0180, 8, 8 + 4 * len(attr_nomes)) + b"".join(struct.pack("<I", ATTR_ID[n]) for n in attr_nomes)

    corpo = bytearray()
    NONE = 0xFFFFFFFF
    corpo += struct.pack("<HHIIIII", 0x0100, 0x10, 24, 1, NONE, si["android"], si[ANDROID_NS])

    def emitir(no, linha=[1]):
        tag, attrs, filhos = no
        linha[0] += 1
        attrs = sorted(attrs, key=lambda a: ATTR_ID.get(a[1], 0) if a[0] else 0)
        corpo_attr = bytearray()
        for ns, nome, tp, val in attrs:
            ns_i = si[ANDROID_NS] if ns else NONE
            if tp == TYPE_STRING:
                raw, dado = si[val], si[val]
            elif tp == TYPE_BOOL:
                raw, dado = NONE, 0xFFFFFFFF if val else 0
            else:
                raw, dado = NONE, val
            corpo_attr += struct.pack("<IIIHBBI", ns_i, si[nome], raw, 8, 0, tp, dado)
        tam = 36 + len(corpo_attr)
        corpo.extend(struct.pack("<HHIIIIIHHHHHH", 0x0102, 0x10, tam, linha[0], NONE, NONE, si[tag], 0x14, 0x14, len(attrs), 0, 0, 0))
        corpo.extend(corpo_attr)
        for f in filhos:
            emitir(f)
        linha[0] += 1
        corpo.extend(struct.pack("<HHIIIII", 0x0103, 0x10, 24, linha[0], NONE, NONE, si[tag]))
    emitir(MANIFESTO)
    corpo += struct.pack("<HHIIIII", 0x0101, 0x10, 24, 99, NONE, si["android"], si[ANDROID_NS])

    tudo = pool + resmap + corpo
    return struct.pack("<HHI", 0x0003, 8, 8 + len(tudo)) + tudo


if __name__ == "__main__":
    html, saida = sys.argv[1], sys.argv[2]
    with zipfile.ZipFile(saida, "w") as z:
        z.writestr("AndroidManifest.xml", gerar_manifesto(), compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("classes.dex", gerar_dex(), compress_type=zipfile.ZIP_DEFLATED)
        z.write(html, "assets/index.html", compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("resources.arsc", gerar_recursos(), compress_type=zipfile.ZIP_STORED)
        z.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "icone.png"), ICONE_APK, compress_type=zipfile.ZIP_STORED)
    print("ok", saida)
