/**
 * GenoParse: RNA to Protein Translator Logic
 * Client-side sequence processing, FASTA parsing, and Polypeptide Synthesis
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const rnaInput = document.getElementById('rna-input');
    const proteinOutput = document.getElementById('protein-output');
    const btnTranslate = document.getElementById('btn-translate');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const inputCount = document.getElementById('input-count');
    const outputCount = document.getElementById('output-count');
    const dropzone = document.getElementById('fasta-dropzone');
    const fileInput = document.getElementById('file-input');

    // Standard Genetic Code: RNA Codons to 1-Letter Amino Acid Codes
    const codonTable = {
        'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
        'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
        'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M', // Start codon
        'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
        'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
        'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
        'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
        'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
        'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*', // Stop codons
        'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
        'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
        'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
        'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W', // Stop codon
        'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
        'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
        'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };

    // Update character counts dynamically
    const updateCounts = () => {
        const inputLen = rnaInput.value.replace(/\s+/g, '').length;
        const outputLen = proteinOutput.value.replace(/\s+/g, '').length;
        inputCount.textContent = `${inputLen} bases`;
        outputCount.textContent = `${outputLen} amino acids`;
    };

    rnaInput.addEventListener('input', updateCounts);

    // CoreFASTA Parser & Sanitizer
    const cleanRNASequence = (rawText) => {
        let lines = rawText.split('\n');
        // Filter out FASTA headers (lines starting with '>') and comments
        let sequenceLines = lines.filter(line => !line.trim().startsWith('>'));
        let rawSeq = sequenceLines.join('');
        
        // Remove spaces, numbers, and anything that isn't A, U, G, or C (case-insensitive)
        rawSeq = rawSeq.replace(/[^AaUuGgCc]/g, '').toUpperCase();
        return rawSeq;
    };

    // Translation Logic
    const translateToProtein = (rnaSeq) => {
        let proteinSeq = '';
        
        // Search for the Start Codon (AUG). If found, start translation there.
        // If not found, default to translating from the first base (Frame 1).
        let startIndex = rnaSeq.indexOf('AUG');
        if (startIndex === -1) startIndex = 0; 

        // Read in triplets (codons)
        for (let i = startIndex; i < rnaSeq.length - 2; i += 3) {
            let codon = rnaSeq.substring(i, i + 3);
            let aminoAcid = codonTable[codon];
            
            if (aminoAcid === '*') {
                break; // Stop codon detected, halt synthesis
            }
            if (aminoAcid) {
                proteinSeq += aminoAcid;
            }
        }
        return proteinSeq;
    };

    // Execute Translation on Button Click
    btnTranslate.addEventListener('click', () => {
        const rawText = rnaInput.value;
        if (!rawText.trim()) return;

        const cleanRNA = cleanRNASequence(rawText);
        if (cleanRNA.length < 3) {
            alert("Sequence too short. Please provide at least one valid triplet codon.");
            return;
        }

        const protein = translateToProtein(cleanRNA);
        proteinOutput.value = protein;
        updateCounts();
    });

    // Clear Workspace
    btnClear.addEventListener('click', () => {
        rnaInput.value = '';
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

        const fastaContent = `>GenoParse_Translated_Protein\n${proteinText.match(/.{1,80}/g).join('\n')}`;
        const blob = new Blob([fastaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'translated_protein.fasta');
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
            rnaInput.value = e.target.result;
            updateCounts();
        };
        reader.readAsText(file);
    };
});
