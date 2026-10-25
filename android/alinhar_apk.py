"""zipalign em Python: regrava o APK (ja assinado) alinhando a 4 bytes os arquivos sem compressao
(resources.arsc e o icone). A assinatura v1 cobre so o conteudo, entao continua valida.
Uso: python3 alinhar_apk.py entrada.apk saida.apk
"""
import sys, zipfile

with zipfile.ZipFile(sys.argv[1]) as zin, zipfile.ZipFile(sys.argv[2], "w") as zout:
    for info in zin.infolist():
        dados = zin.read(info.filename)
        novo = zipfile.ZipInfo(info.filename, info.date_time)
        novo.compress_type = info.compress_type
        novo.external_attr = info.external_attr
        if info.compress_type == zipfile.ZIP_STORED:
            inicio = zout.fp.tell() + 30 + len(info.filename.encode())
            novo.extra = b"\0" * ((4 - inicio % 4) % 4)
        zout.writestr(novo, dados)
