/**
 * GenoParse: FASTA File Parser Logic
 * Cleans sequences, extracts headers, formats blocks, calculates GC Content
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fastaInput = document.getElementById('fasta-input');
    const sequenceOutput = document.getElementById('sequence-output');
    const headerOutput = document.getElementById('header-output');
    
    const lengthCount = document.getElementById('length-count');
    const gcContent = document.getElementById('gc-content');
    
    const btnParse = document.getElementById('btn-parse');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    
    const dropzone = document.getElementById('fasta-dropzone');
    const fileInput = document.getElementById('file-input');

    // Global variables to store parsed data
    let currentHeader = 'GenoParse_Sequence';
    let currentCleanSequence = '';

    // Ultimate Strict Sanitizer: Prevents counting \r and invisible trailing spaces
    const parseFasta = (rawText) => {
        let lines = rawText.split('\n');
        let headerLines = [];
        let seqLines = [];

        // Separate headers (start with >) from sequence data
        for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed.startsWith('>')) {
                // Remove the > for cleaner display
                headerLines.push(trimmed.substring(1).trim());
            } else {
                seqLines.push(trimmed);
            }
        }

        // Determine header to use
        currentHeader = headerLines.length > 0 ? headerLines.join(' | ') : 'GenoParse_Sequence';
        
        let rawSeq = seqLines.join('');
        // Aggressively strip everything except explicit uppercase/lowercase A, T, G, C
        // We use the strict regex to prevent hidden carriage returns from inflating the count
        currentCleanSequence = rawSeq.replace(/[^atgcATGC]/g, '').toUpperCase();
        
        // Format to 80 characters per line for display
        let formattedSeq = '';
        if (currentCleanSequence.length > 0) {
            formattedSeq = currentCleanSequence.match(/.{1,80}/g).join('\n');
        }

        // Update UI
        headerOutput.innerHTML = `<span>Metadata:</span> ${currentHeader || 'None detected'}`;
        sequenceOutput.value = formattedSeq;
        
        // Calculate Metrics
        calculateMetrics(currentCleanSequence);
    };

    // Metrics Logic (Length & GC Content)
    const calculateMetrics = (sequence) => {
        const len = sequence.length;
        lengthCount.textContent = `${len} bp/aa`;

        if (len === 0) {
            gcContent.textContent = '0.0%';
            return;
        }

        // Check if it's primarily a nucleic acid sequence (A, T, C, G, U)
        const nucleicChars = sequence.match(/[ATCGU]/g) || [];
        const isNucleicAcid = (nucleicChars.length / len) > 0.8; // If 80% matches, assume DNA/RNA

        if (isNucleicAcid) {
            const gCount = (sequence.match(/G/g) || []).length;
            const cCount = (sequence.match(/C/g) || []).length;
            const gcPercentage = ((gCount + cCount) / len) * 100;
            gcContent.textContent = `${gcPercentage.toFixed(2)}%`;
        } else {
            // It's likely a protein sequence, GC content doesn't apply
            gcContent.textContent = 'N/A';
        }
    };

    // Execute Parse on Button Click
    btnParse.addEventListener('click', () => {
        const rawText = fastaInput.value;
        if (!rawText.trim()) {
            alert("Please paste a sequence or upload a file first.");
            return;
        }
        parseFasta(rawText);
    });

    // Clear Workspace
    btnClear.addEventListener('click', () => {
        fastaInput.value = '';
        sequenceOutput.value = '';
        headerOutput.innerHTML = `<span>Metadata:</span> Awaiting input...`;
        lengthCount.textContent = '0 bp';
        gcContent.textContent = '0.0%';
        currentHeader = 'GenoParse_Sequence';
        currentCleanSequence = '';
    });

    // Copy to Clipboard (Copies the formatted sequence)
    btnCopy.addEventListener('click', () => {
        if (!sequenceOutput.value) return;
        navigator.clipboard.writeText(sequenceOutput.value).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
            }, 2000);
        });
    });

    // Download FASTA File
    btnDownload.addEventListener('click', () => {
        if (!currentCleanSequence) return;

        // Ensure 80 char limit on output file
        const formattedLines = currentCleanSequence.match(/.{1,80}/g).join('\n');
        const fastaContent = `>${currentHeader}\n${formattedLines}`;
        
        const blob = new Blob([fastaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'parsed_sequence.fasta');
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
            fastaInput.value = e.target.result;
            // Optionally auto-parse on drop
            parseFasta(e.target.result);
        };
        reader.readAsText(file);
    };
});
