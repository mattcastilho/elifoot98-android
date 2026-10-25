"""Decodifica arquivos .TXE do Elifoot 98 (doc 15). Uso: python txe_decode.py ARQUIVO.TXE"""
import sys

def decifra(b):
    b = bytearray(b)
    for i in range(len(b) - 1, 0, -1):
        b[i] = (b[i] - b[i - 1]) % 256
    return bytes(b)

def ler_txe(path):
    d = open(path, 'rb').read(); pos = 0; out = []
    while pos < len(d):
        L = d[pos]; s = d[pos:pos + 1 + L]; pos += 1 + L
        out.append(decifra(decifra(s))[1:].decode('cp1252', 'replace'))
    return out

if __name__ == '__main__':
    for linha in ler_txe(sys.argv[1]):
        print(linha)
