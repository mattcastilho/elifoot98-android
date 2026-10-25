// Script do Ghidra: exporta funcoes (assembly) e strings de um programa para um arquivo de texto.
// Uso (headless): -postScript ExportAsm.java <arquivo_de_saida.txt>
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import java.io.*;

public class ExportAsm extends GhidraScript {
    @Override
    protected void run() throws Exception {
        String[] args = getScriptArgs();
        String out = args.length > 0 ? args[0] : "export.txt";
        Listing listing = currentProgram.getListing();
        try (PrintWriter w = new PrintWriter(new FileWriter(out))) {
            w.println("# Programa: " + currentProgram.getName());
            w.println("# Funcoes: " + currentProgram.getFunctionManager().getFunctionCount());
            w.println();
            w.println("## STRINGS");
            DataIterator di = listing.getDefinedData(true);
            while (di.hasNext()) {
                Data d = di.next();
                if (d.hasStringValue()) {
                    w.println(d.getAddress() + "\t" + d.getDefaultValueRepresentation());
                }
            }
            w.println();
            w.println("## FUNCOES");
            FunctionIterator fi = listing.getFunctions(true);
            while (fi.hasNext()) {
                Function f = fi.next();
                w.println("FUNCTION " + f.getName() + " @ " + f.getEntryPoint());
                InstructionIterator ii = listing.getInstructions(f.getBody(), true);
                while (ii.hasNext()) {
                    Instruction in = ii.next();
                    w.println("  " + in.getAddress() + ": " + in);
                }
                w.println();
            }
        }
        println("Exportado para " + out);
    }
}
