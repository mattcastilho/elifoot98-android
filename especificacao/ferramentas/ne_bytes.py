"""Le bytes de um segmento de um executavel NE (Windows 16 bits) e decodifica constantes.
Uso: python ne_bytes.py ELIFOOT.EXE 1010:8180 [tamanho]
Seletor Ghidra -> segmento NE: indice = (seletor - 0x1000)/8 + 1 (1-based)."""
import sys, struct
def carregar(path):
    d = open(path, 'rb').read()
    ne = struct.unpack_from('<I', d, 0x3c)[0]
    nseg = struct.unpack_from('<H', d, ne + 0x1c)[0]
    segtab = struct.unpack_from('<H', d, ne + 0x22)[0]
    shift = struct.unpack_from('<H', d, ne + 0x32)[0]
    segs = []
    for i in range(nseg):
        off, ln, fl, mina = struct.unpack_from('<HHHH', d, ne + segtab + 8 * i)
        segs.append((off << shift, ln or 0x10000, fl, mina))
    return d, segs
def ler(d, segs, sel, off, n):
    i = (sel - 0x1000) // 8
    so, ln, fl, _ = segs[i]
    return d[so + off: so + off + n]
if __name__ == '__main__':
    d, segs = carregar(sys.argv[1])
    sel, off = [int(x, 16) for x in sys.argv[2].split(':')]
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 16
    b = ler(d, segs, sel, off, n)
    print(b.hex(' '))
    if n >= 4: print('single :', struct.unpack('<f', b[:4])[0])
    if n >= 8: print('double :', struct.unpack('<d', b[:8])[0])
    if n >= 6:
        e = b[0]; m = int.from_bytes(b[1:6], 'little')
        if e == 0: print('real48 : 0')
        else:
            sign = -1 if m >> 39 else 1
            frac = ((m & ((1 << 39) - 1)) / (1 << 39)) + 1
            print('real48 :', sign * frac * 2 ** (e - 129))
    if n >= 10:
        mant = int.from_bytes(b[:8], 'little'); ex = int.from_bytes(b[8:10], 'little')
        s = -1 if ex >> 15 else 1; ex &= 0x7fff
        print('extend.:', s * mant / 2**63 * 2 ** (ex - 16383))
