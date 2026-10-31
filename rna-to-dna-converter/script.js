/**
 * GenoParse: RNA to DNA Converter Logic
 * Reverse Transcription (Uracil -> Thymine Conversion)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const rnaInput = document.getElementById('rna-input');
    const dnaOutput = document.getElementById('dna-output');
    const btnConvert = document.getElementById('btn-convert');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const inputCount = document.getElementById('input-count');
    const outputCount = document.getElementById('output-count');
    const dropzone = document.getElementById('fasta-dropzone');
    const fileInput = document.getElementById('file-input');

    // Ultimate Strict Sanitizer: Strips headers, spaces, line breaks, and non-RNA chars entirely
    const cleanRNASequence = (rawText) => {
        let lines = rawText.split('\n');
        let sequenceLines = lines.filter(line => !line.trim().startsWith('>'));
        let rawSeq = sequenceLines.join('');
        
        // Aggressively strip everything except explicit uppercase/lowercase A, U, G, C
        return rawSeq.replace(/[^augcAUGC]/g, '').toUpperCase();
    };

    // Update character counts dynamically and synchronously
    const updateCounts = (rnaText = '', dnaText = '') => {
        const cleanRNA = cleanRNASequence(rnaText || rnaInput.value);
        const cleanDNA = dnaText || dnaOutput.value.replace(/[^ATGC]/g, '');
        
        inputCount.textContent = `${cleanRNA.length} bases`;
        outputCount.textContent = `${cleanDNA.length} bases`;
    };

    rnaInput.addEventListener('input', () => updateCounts());

    // Reverse Transcription Logic (U -> T)
    const reverseTranscribe = (rnaSeq) => {
        return rnaSeq.replace(/U/g, 'T');
    };

    // Execute Conversion on Button Click
    btnConvert.addEventListener('click', () => {
        const rawText = rnaInput.value;
        if (!rawText.trim()) return;

        const cleanRNA = cleanRNASequence(rawText);
        if (cleanRNA.length === 0) {
            alert("No valid RNA bases found. Please check your input.");
            return;
        }

        const dnaScaffold = reverseTranscribe(cleanRNA);
        dnaOutput.value = dnaScaffold;
        
        // Pass explicit strings to force identical length calculation
        updateCounts(cleanRNA, dnaScaffold);
    });

    // Clear Workspace
    btnClear.addEventListener('click', () => {
        rnaInput.value = '';
        dnaOutput.value = '';
        updateCounts('', '');
    });

    // Copy to Clipboard
    btnCopy.addEventListener('click', () => {
        if (!dnaOutput.value) return;
        navigator.clipboard.writeText(dnaOutput.value).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
            }, 2000);
        });
    });

    // Download FASTA File
    btnDownload.addEventListener('click', () => {
        const dnaText = dnaOutput.value;
        if (!dnaText) return;

        // Formats output with 80 characters per line
        const fastaContent = `>GenoParse_Reverse_Transcribed_DNA\n${dnaText.match(/.{1,80}/g).join('\n')}`;
        const blob = new Blob([fastaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'cDNA_scaffold.fasta');
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
            const cleanRNA = cleanRNASequence(e.target.result);
            updateCounts(cleanRNA, '');
        };
        reader.readAsText(file);
    };
});
