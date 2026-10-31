/**
 * GenoParse: DNA to Protein Converter Logic
 * Direct Client-Side Compilation (Bypasses RNA step)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dnaInput = document.getElementById('dna-input');
    const proteinOutput = document.getElementById('protein-output');
    const btnCompile = document.getElementById('btn-compile');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const inputCount = document.getElementById('input-count');
    const outputCount = document.getElementById('output-count');
    const dropzone = document.getElementById('fasta-dropzone');
    const fileInput = document.getElementById('file-input');

    // DNA Codon Table: DNA Triplets to 1-Letter Amino Acid Codes
    const dnaCodonTable = {
        'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
        'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
        'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M', // Start codon
        'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
        'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
        'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
        'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
        'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
        'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*', // Stop codons
        'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
        'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
        'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
        'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W', // Stop codon
        'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
        'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
        'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };

    // Update character counts dynamically
    const updateCounts = () => {
        const inputLen = dnaInput.value.replace(/\s+/g, '').length;
        const outputLen = proteinOutput.value.replace(/\s+/g, '').length;
        inputCount.textContent = `${inputLen} bases`;
        outputCount.textContent = `${outputLen} aa`;
    };

    dnaInput.addEventListener('input', updateCounts);

    // CoreFASTA Parser & Sanitizer (Filters only A, T, G, C)
    const cleanDNASequence = (rawText) => {
        let lines = rawText.split('\n');
        // Filter out FASTA headers (lines starting with '>')
        let sequenceLines = lines.filter(line => !line.trim().startsWith('>'));
        let rawSeq = sequenceLines.join('');
        
        // Remove spaces, numbers, and anything that isn't A, T, G, or C
        rawSeq = rawSeq.replace(/[^AaTtGgCc]/g, '').toUpperCase();
        return rawSeq;
    };

    // Compilation Logic (DNA directly to Protein) - Updated for Whole Genomes
    const compileToProtein = (dnaSeq) => {
        let proteinSeq = '';
        
        // Search for the DNA Start Codon (ATG). If found, begin synthesis there.
        // If not found, default to Frame 1 (index 0).
        let startIndex = dnaSeq.indexOf('ATG');
        if (startIndex === -1) startIndex = 0; 

        // Read the DNA in triplets across the entire file
        for (let i = startIndex; i < dnaSeq.length - 2; i += 3) {
            let codon = dnaSeq.substring(i, i + 3);
            let aminoAcid = dnaCodonTable[codon];
            
            if (aminoAcid === '*') {
                proteinSeq += '*'; // Mark stop codon and continue translation
                continue;
            }
            if (aminoAcid) {
                proteinSeq += aminoAcid;
            }
        }
        return proteinSeq;
    };

    // Execute Compilation on Button Click
    btnCompile.addEventListener('click', () => {
        const rawText = dnaInput.value;
        if (!rawText.trim()) return;

        const cleanDNA = cleanDNASequence(rawText);
        if (cleanDNA.length < 3) {
            alert("Sequence too short. Please provide at least one valid triplet codon.");
            return;
        }

        const protein = compileToProtein(cleanDNA);
        proteinOutput.value = protein;
        updateCounts();
    });

    // Clear Workspace
    btnClear.addEventListener('click', () => {
        dnaInput.value = '';
        proteinOutput.value = '';
        updateCounts();
    });

    // Copy to Clipboard
    btnCopy.addEventListener('click', () => {
        if (!proteinOutput.value) return;
        navigator.clipboard.writeText(proteinOutput.value).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
            }, 2000);
        });
    });

    // Download FASTA File
    btnDownload.addEventListener('click', () => {
        const proteinText = proteinOutput.value;
        if (!proteinText) return;

        const fastaContent = `>GenoParse_Compiled_Protein\n${proteinText.match(/.{1,80}/g).join('\n')}`;
        const blob = new Blob([fastaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'compiled_protein.fasta');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    // Drag & Drop FASTA Handling
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    const handleFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            dnaInput.value = e.target.result;
            updateCounts();
        };
        reader.readAsText(file);
    };
});
