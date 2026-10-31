/**
 * GenoParse: Unified DNA, RNA & Protein Converter Logic
 * Central Dogma Pipeline: DNA -> RNA -> Protein
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dnaInput = document.getElementById('dna-input');
    const rnaOutput = document.getElementById('rna-output');
    const proteinOutput = document.getElementById('protein-output');
    
    const btnRunPipeline = document.getElementById('btn-run-pipeline');
    const btnClear = document.getElementById('btn-clear');
    
    const btnCopyRna = document.getElementById('btn-copy-rna');
    const btnDlRna = document.getElementById('btn-dl-rna');
    const btnCopyProtein = document.getElementById('btn-copy-protein');
    const btnDlProtein = document.getElementById('btn-dl-protein');
    
    const inputCount = document.getElementById('input-count');
    const rnaCount = document.getElementById('rna-count');
    const proteinCount = document.getElementById('protein-count');
    
    const dropzone = document.getElementById('fasta-dropzone');
    const fileInput = document.getElementById('file-input');

    // RNA Codon Table: RNA Triplets to 1-Letter Amino Acid Codes
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

    // CoreFASTA Parser (Isolates valid DNA bases: A, T, G, C)
    const cleanDNASequence = (rawText) => {
        let lines = rawText.split('\n');
        let sequenceLines = lines.filter(line => !line.trim().startsWith('>'));
        let rawSeq = sequenceLines.join('');
        return rawSeq.replace(/[^AaTtGgCc]/g, '').toUpperCase();
    };

    // Update character counts dynamically based on active values
    const updateCounts = (dnaText = '', rnaText = '', proteinText = '') => {
        const cleanDNA = cleanDNASequence(dnaText || dnaInput.value);
        const cleanRNA = rnaText.replace(/[^AUGC]/g, '');
        const cleanProtein = proteinText.replace(/[^A-Z*]/g, '');
        
        inputCount.textContent = `${cleanDNA.length} bases`;
        rnaCount.textContent = `${cleanRNA.length} bases`;
        proteinCount.textContent = `${cleanProtein.length} aa`;
    };

    dnaInput.addEventListener('input', () => updateCounts());

    // Step 1: Transcription (DNA Coding Strand -> RNA)
    const transcribeToRNA = (dnaSeq) => {
        return dnaSeq.replace(/T/g, 'U');
    };

    // Step 2: Translation (RNA -> Protein)
    const translateToProtein = (rnaSeq) => {
        let proteinSeq = '';
        let startIndex = rnaSeq.indexOf('AUG');
        if (startIndex === -1) startIndex = 0; 

        for (let i = startIndex; i < rnaSeq.length - 2; i += 3) {
            let codon = rnaSeq.substring(i, i + 3);
            let aminoAcid = codonTable[codon];
            
            if (aminoAcid === '*') {
                proteinSeq += '*'; 
                continue; 
            }
            if (aminoAcid) proteinSeq += aminoAcid;
        }
        return proteinSeq;
    };

    // Execute Full Pipeline on Button Click
    btnRunPipeline.addEventListener('click', () => {
        const rawText = dnaInput.value;
        if (!rawText.trim()) return;

        const cleanDNA = cleanDNASequence(rawText);
        if (cleanDNA.length === 0) {
            alert("No valid DNA bases found. Please check your input.");
            return;
        }

        // Run the Central Dogma
        const rnaTranscript = transcribeToRNA(cleanDNA);
        const proteinChain = translateToProtein(rnaTranscript);

        // Populate Outputs
        rnaOutput.value = rnaTranscript;
        proteinOutput.value = proteinChain;
        
        // Update counts with actual processed outputs
        updateCounts(cleanDNA, rnaTranscript, proteinChain);
    });

    // Clear Workspace
    btnClear.addEventListener('click', () => {
        dnaInput.value = '';
        rnaOutput.value = '';
        proteinOutput.value = '';
        updateCounts('', '', '');
    });

    // --- COPY FUNCTIONS ---
    const handleCopy = (element, btnElement, defaultText) => {
        if (!element.value) return;
        navigator.clipboard.writeText(element.value).then(() => {
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                btnElement.innerHTML = defaultText;
            }, 2000);
        });
    };

    btnCopyRna.addEventListener('click', () => handleCopy(rnaOutput, btnCopyRna, '<i class="fa-regular fa-copy"></i> Copy RNA'));
    btnCopyProtein.addEventListener('click', () => handleCopy(proteinOutput, btnCopyProtein, '<i class="fa-regular fa-copy"></i> Copy Protein'));

    // --- DOWNLOAD FUNCTIONS ---
    const handleDownload = (element, filename, header) => {
        const text = element.value;
        if (!text) return;

        const fastaContent = `>${header}\n${text.match(/.{1,80}/g).join('\n')}`;
        const blob = new Blob([fastaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    btnDlRna.addEventListener('click', () => handleDownload(rnaOutput, 'transcribed_RNA.fasta', 'GenoParse_Transcribed_RNA'));
    btnDlProtein.addEventListener('click', () => handleDownload(proteinOutput, 'translated_Protein.fasta', 'GenoParse_Translated_Protein'));

    // --- DRAG & DROP HANDLING ---
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
            const cleanDNA = cleanDNASequence(e.target.result);
            updateCounts(cleanDNA, '', '');
        };
        reader.readAsText(file);
    };
});
