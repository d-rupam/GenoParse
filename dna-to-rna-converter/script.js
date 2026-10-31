/**
 * GenoParse - Client-Side Sequence Compiler
 * Module: DNA to RNA Transcription
 * Execution: 100% Local Browser Memory (Zero Server Uploads)
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const dnaInput = document.getElementById("dna-input");
    const rnaOutput = document.getElementById("rna-output");
    const inputCount = document.getElementById("input-count");
    const outputCount = document.getElementById("output-count");
    
    const btnTranscribe = document.getElementById("btn-transcribe");
    const btnClear = document.getElementById("btn-clear");
    const btnCopy = document.getElementById("btn-copy");
    const btnDownload = document.getElementById("btn-download");
    
    const dropzone = document.getElementById("fasta-dropzone");
    const fileInput = document.getElementById("file-input");

    // --- Core Biological Logic ---
    
    /**
     * Parses and sanitizes raw input data.
     * Removes FASTA headers, spaces, numbers, and non-nucleotide characters.
     */
    function sanitizeDNA(rawText) {
        // 1. Remove FASTA header lines (anything starting with '>' until the end of the line)
        let processedText = rawText.replace(/^>.*$/gm, '');
        
        // 2. Remove all spaces, tabs, newlines, and numbers
        processedText = processedText.replace(/[\s\d]/g, '');
        
        // 3. Keep strictly DNA characters (A, T, G, C, and N for unknown bases) and force Uppercase
        processedText = processedText.replace(/[^ATGCatgcNn]/g, '').toUpperCase();
        
        return processedText;
    }

    /**
     * Transcribes the sanitized DNA sequence into an RNA transcript.
     * Replaces all Thymine (T) with Uracil (U).
     */
    function transcribeToRNA(dnaSequence) {
        return dnaSequence.replace(/T/g, 'U');
    }

    /**
     * Updates the base pair counters in the UI.
     */
    function updateCounts(inCount, outCount) {
        inputCount.textContent = `${inCount.toLocaleString()} bases`;
        outputCount.textContent = `${outCount.toLocaleString()} bases`;
    }

    // --- Event Listeners: Transcription & UI ---

    // Live counter for manual typing
    dnaInput.addEventListener("input", () => {
        const currentLength = sanitizeDNA(dnaInput.value).length;
        inputCount.textContent = `${currentLength.toLocaleString()} bases`;
    });

    // Execute Transcription Button
    btnTranscribe.addEventListener("click", () => {
        const rawInput = dnaInput.value;
        if (!rawInput.trim()) {
            alert("Please paste a sequence or upload a FASTA file first.");
            return;
        }

        // Sanitize & Compile
        const cleanDNA = sanitizeDNA(rawInput);
        const rnaTranscript = transcribeToRNA(cleanDNA);

        // Update UI
        dnaInput.value = cleanDNA; // Updates the input box to show the cleaned, raw code
        rnaOutput.value = rnaTranscript;
        updateCounts(cleanDNA.length, rnaTranscript.length);
        
        console.log(`[GenoParse] Transcription complete: ${cleanDNA.length} bases processed.`);
    });

    // Clear Workspace Button
    btnClear.addEventListener("click", () => {
        dnaInput.value = "";
        rnaOutput.value = "";
        fileInput.value = ""; // Reset file input
        updateCounts(0, 0);
    });

    // Copy to Clipboard Button
    btnCopy.addEventListener("click", () => {
        if (!rnaOutput.value) return;
        
        navigator.clipboard.writeText(rnaOutput.value).then(() => {
            const originalHTML = btnCopy.innerHTML;
            btnCopy.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
            btnCopy.style.backgroundColor = "#00ffaa";
            btnCopy.style.color = "#000";
            btnCopy.style.borderColor = "#00ffaa";
            
            setTimeout(() => {
                btnCopy.innerHTML = originalHTML;
                btnCopy.style = "";
            }, 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
            alert("Clipboard access denied. Please copy manually.");
        });
    });

    // Download FASTA File Button
    btnDownload.addEventListener("click", () => {
        const sequence = rnaOutput.value;
        if (!sequence) {
            alert("No RNA transcript available to download.");
            return;
        }

        // Standard FASTA format: Break sequence into 80-character lines
        const lineLength = 80;
        let formattedSequence = "";
        for (let i = 0; i < sequence.length; i += lineLength) {
            formattedSequence += sequence.substring(i, i + lineLength) + "\n";
        }

        // Construct the final FASTA payload
        const fastaContent = `>GenoParse_RNA_Transcript | Length: ${sequence.length}bp\n${formattedSequence}`;
        
        // Create Blob and trigger download
        const blob = new Blob([fastaContent], { type: "text/plain" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        a.href = downloadUrl;
        a.download = `RNA_Transcript_${Date.now()}.fasta`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    });

    // --- File Upload & Drag-and-Drop Logic ---

    // Click dropzone to open file dialog
    dropzone.addEventListener("click", () => {
        fileInput.click();
    });

    // Handle file selection via dialog
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    });

    // Drag and Drop Events
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        
        if (e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    });

    // File Reader Engine
    function processFile(file) {
        // Accept .fasta, .txt, .fna, .fas or generic text files
        const validExtensions = ['.fasta', '.txt', '.fas', '.fna'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext)) || file.type.startsWith('text/');

        if (!isValid) {
            alert("Invalid file format. Please upload a .fasta or .txt file.");
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const rawFileContent = e.target.result;
            dnaInput.value = rawFileContent; // Load raw content into text area
            
            // Automatically trigger the character count update
            const currentLength = sanitizeDNA(rawFileContent).length;
            inputCount.textContent = `${currentLength.toLocaleString()} bases`;
            
            console.log(`[GenoParse] File loaded: ${file.name} (${currentLength} bases detected)`);
        };
        
        reader.onerror = () => {
            alert("Error reading the file. Please try again.");
        };

        reader.readAsText(file);
    }

    // --- Initialization Boot Sequence ---
    console.log("%c[GenoParse] DNA to RNA Transcription Module Loaded.", "color: #06b6d4; font-weight: bold;");
    console.log("%cData Sovereignty Protocol: Active.", "color: #00ffaa;");
});
