document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
    const elements = {
        fileInput: document.getElementById('file-input'),
        uploadPlaceholder: document.getElementById('upload-placeholder'),
        previewContainer: document.getElementById('preview-container'),
        imagePreview: document.getElementById('image-preview'),
        actionContainer: document.getElementById('action-container'),
        resultsSection: document.getElementById('results-section'),
        paletteGrid: document.getElementById('palette-grid'),
        btnProcess: document.getElementById('btn-process'),
        btnText: document.getElementById('btn-text'),
        loadingSpinner: document.getElementById('loading-spinner')
    };

    let selectedFile = null;
    // Inicializa a biblioteca ColorThief
    const colorThief = new ColorThief();

    // --- 2. EVENT LISTENERS ---
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.btnProcess.addEventListener('click', processImage);


    // --- 3. FUNÇÕES DE LÓGICA ---

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            
            reader.onload = function(event) {
                elements.imagePreview.src = event.target.result;
                elements.uploadPlaceholder.classList.add('hidden');
                elements.previewContainer.classList.remove('hidden');
                elements.actionContainer.classList.remove('hidden');
                elements.resultsSection.classList.add('hidden');
            }
            
            reader.readAsDataURL(file);
        }
    }

    async function processImage() {
        // Verifica se a imagem já carregou completamente no navegador
        if (!elements.imagePreview.complete) {
            alert("Aguarde a imagem carregar totalmente.");
            return;
        }

        toggleLoadingState(true);

        // Pequeno delay para a UI atualizar e mostrar o spinner
        setTimeout(() => {
            try {
                // --- LÓGICA REAL DE EXTRAÇÃO ---
                
                // 1. Pede ao ColorThief 5 cores (o número 5 é a quantidade)
                const coresRGB = colorThief.getPalette(elements.imagePreview, 5);
                
                // 2. Converte de RGB [[r,g,b], [r,g,b]...] para HEX ["#...", "#..."]
                const coresHex = coresRGB.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

                // 3. Renderiza na tela
                renderPalette(coresHex);

            } catch (error) {
                console.error(error);
                alert("Não foi possível extrair as cores desta imagem.");
            } finally {
                toggleLoadingState(false);
            }
        }, 100); // 100ms só para garantir que o spinner apareça
    }

    // --- FUNÇÕES AUXILIARES ---

    // Converte (r, g, b) para string Hexadecimal (#RRGGBB)
    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function toggleLoadingState(isLoading) {
        elements.btnProcess.disabled = isLoading;
        if (isLoading) {
            elements.btnText.textContent = "Processando...";
            elements.loadingSpinner.classList.remove('hidden');
        } else {
            elements.btnText.textContent = "Gerar Paleta";
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    function renderPalette(colors) {
        elements.paletteGrid.innerHTML = ''; 
        
        colors.forEach(hex => {
            const card = createColorCard(hex);
            elements.paletteGrid.appendChild(card);
        });

        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function createColorCard(hex) {
        const card = document.createElement('div');
        card.className = "group cursor-pointer flex flex-col gap-2";
        
        card.addEventListener('click', () => copyColorToClipboard(hex));

        card.innerHTML = `
            <div class="h-28 w-full rounded-lg shadow-sm transition-transform transform group-hover:scale-105 relative overflow-hidden" style="background-color: ${hex};">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span class="text-white opacity-0 group-hover:opacity-100 font-bold text-sm">Copiar</span>
                </div>
            </div>
            <div class="flex justify-between items-center px-1">
                <span class="text-slate-600 font-mono font-medium text-sm">${hex}</span>
            </div>
        `;
        return card;
    }

    function copyColorToClipboard(hex) {
        navigator.clipboard.writeText(hex).then(() => {
            console.log(`Copiado: ${hex}`);
            // Feedback simples trocando o texto do título temporariamente
            const originalTitle = document.querySelector('h2').innerText;
            document.querySelector('h2').innerText = `Copiado: ${hex}!`;
            setTimeout(() => document.querySelector('h2').innerText = originalTitle, 1500);
        });
    }
});