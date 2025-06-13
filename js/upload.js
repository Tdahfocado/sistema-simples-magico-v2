/**
 * Módulo Upload e OCR - Sistema Simples e Mágico
 * Versão 2.0 - Corrigida e Melhorada
 * Processamento de arquivos PDF, DOC, DOCX, TXT com OCR
 * Extração inteligente de texto e preenchimento automático
 */

class UploadProcessor {
    constructor() {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            supportedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'text/html'
            ],
            supportedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.html'],
            ocrLanguages: ['por', 'eng'], // Português e Inglês
            processingTimeout: 60000 // 1 minuto
        };
        
        this.state = {
            isProcessing: false,
            currentFiles: [],
            extractedText: '',
            processedData: null
        };
        
        // Padrões para extração de dados
        this.patterns = {
            numeroProcesso: [
                /(?:processo|n[úu]mero|n[°º]?)\s*:?\s*(\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4})/gi,
                /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/g,
                /(\d{13,20})/g
            ],
            nomesPessoas: [
                /(?:autor|requerente|demandante)\s*:?\s*([A-ZÁÀÁÂÃÄÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝ][a-záàáâãäçéèêëíìîïñóòôõöúùûüý\s]+)/gi,
                /(?:r[eé]u|requerido|demandado)\s*:?\s*([A-ZÁÀÁÂÃÄÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝ][a-záàáâãäçéèêëíìîïñóòôõöúùûüý\s]+)/gi
            ],
            pedidos: [
                /(?:pede|requer|solicita|pleiteia)\s*:?\s*([^.]{20,200})/gi,
                /(?:pedido|requerimento|solicita[çc][ãa]o)\s*:?\s*([^.]{20,200})/gi
            ],
            decisoes: [
                /(?:decido|julgo|defiro|indefiro|homologo)\s*:?\s*([^.]{20,300})/gi,
                /(?:decis[ãa]o|julgamento|senten[çc]a)\s*:?\s*([^.]{20,300})/gi
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        console.log('📁 Sistema de Upload inicializado!');
    }
    
    setupEventListeners() {
        // Input de arquivo
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Botão processar
        const btnProcessar = document.getElementById('btnProcessarIA');
        if (btnProcessar) {
            btnProcessar.addEventListener('click', () => this.processarComIA());
        }
        
        // Área de upload
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }
    }
    
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;
        
        // Prevenir comportamento padrão do navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Destacar área durante drag
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });
        
        // Processar arquivos soltos
        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.processarArquivos(files);
        }, false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.processarArquivos(files);
    }
    
    async processarArquivos(files) {
        if (this.state.isProcessing) {
            this.mostrarErro('Já existe um processamento em andamento. Aguarde.');
            return;
        }
        
        if (files.length === 0) return;
        
        this.state.isProcessing = true;
        this.state.currentFiles = Array.from(files);
        this.state.extractedText = ''; // Reset do texto extraído
        
        try {
            this.mostrarStatus('Iniciando processamento...');
            this.mostrarProgresso(0);
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progresso = Math.floor((i / files.length) * 100);
                
                this.mostrarProgresso(progresso);
                this.mostrarStatus(`Processando ${file.name}...`);
                
                // Validar arquivo
                if (!this.validarArquivo(file)) {
                    continue;
                }
                
                // Processar arquivo baseado no tipo
                const texto = await this.extrairTexto(file);
                
                if (texto) {
                    this.state.extractedText += texto + '\n\n';
                }
            }
            
            this.mostrarProgresso(100);
            
            if (this.state.extractedText.trim()) {
                this.exibirTextoExtraido();
                this.habilitarBotaoProcessar();
                this.mostrarSucesso(`${files.length} arquivo(s) processado(s) com sucesso!`);
                
                // Incrementar estatística
                if (window.sistemaSimplesMagico) {
                    window.sistemaSimplesMagico.incrementarEstatistica('uploadsProcessados');
                }
            } else {
                this.mostrarErro('Nenhum texto foi extraído dos arquivos. Verifique se são documentos válidos.');
            }
            
        } catch (error) {
            console.error('Erro no processamento:', error);
            this.mostrarErro('Erro ao processar arquivos: ' + error.message);
        } finally {
            this.state.isProcessing = false;
            setTimeout(() => this.ocultarProgresso(), 2000);
        }
    }
    
    validarArquivo(file) {
        // Verificar tamanho
        if (file.size > this.config.maxFileSize) {
            this.mostrarErro(`Arquivo ${file.name} muito grande. Máximo permitido: 10MB.`);
            return false;
        }
        
        // Verificar se o arquivo não está vazio
        if (file.size === 0) {
            this.mostrarErro(`Arquivo ${file.name} está vazio.`);
            return false;
        }
        
        // Verificar tipo
        const isValidType = this.config.supportedTypes.includes(file.type) ||
                           this.config.supportedExtensions.some(ext => 
                               file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
            this.mostrarErro(`Formato não suportado: ${file.name}. Use PDF, DOC, DOCX ou TXT.`);
            return false;
        }
        
        return true;
    }
    
    async extrairTexto(file) {
        const fileType = file.type || this.detectarTipoPorExtensao(file.name);
        
        try {
            switch (fileType) {
                case 'application/pdf':
                    return await this.extrairTextoPDF(file);
                case 'application/msword':
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    return await this.extrairTextoWord(file);
                case 'text/plain':
                case 'text/html':
                    return await this.extrairTextoSimples(file);
                default:
                    // Tentar OCR como último recurso
                    return await this.extrairTextoOCR(file);
            }
        } catch (error) {
            console.error(`Erro ao extrair texto de ${file.name}:`, error);
            // Tentar OCR como fallback
            try {
                this.mostrarStatus(`Tentando OCR em ${file.name}...`);
                return await this.extrairTextoOCR(file);
            } catch (ocrError) {
                console.error('OCR também falhou:', ocrError);
                throw new Error(`Não foi possível extrair texto de ${file.name}: ${error.message}`);
            }
        }
    }
    
    detectarTipoPorExtensao(nomeArquivo) {
        const extensao = nomeArquivo.toLowerCase().split('.').pop();
        
        const tiposPorExtensao = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'html': 'text/html',
            'htm': 'text/html'
        };
        
        return tiposPorExtensao[extensao] || 'application/octet-stream';
    }
    
    async extrairTextoPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    // Verificar se PDF.js está disponível
                    if (typeof pdfjsLib === 'undefined') {
                        throw new Error('PDF.js não está carregado');
                    }
                    
                    const typedarray = new Uint8Array(e.target.result);
                    
                    // Configurar PDF.js para não usar workers (mais compatível)
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    
                    const loadingTask = pdfjsLib.getDocument(typedarray);
                    const pdf = await loadingTask.promise;
                    let textoCompleto = '';
                    
                    // Processar cada página
                    for (let numeroPage = 1; numeroPage <= pdf.numPages; numeroPage++) {
                        const page = await pdf.getPage(numeroPage);
                        const textContent = await page.getTextContent();
                        
                        const textoPage = textContent.items
                            .map(item => item.str)
                            .join(' ');
                        
                        textoCompleto += textoPage + '\n';
                        
                        // Atualizar progresso
                        const progresso = Math.floor((numeroPage / pdf.numPages) * 100);
                        if (window.uploadProcessor) {
                            window.uploadProcessor.mostrarStatus(`PDF: Página ${numeroPage}/${pdf.numPages} (${progresso}%)`);
                        }
                    }
                    
                    if (textoCompleto.trim().length < 10) {
                        throw new Error('PDF parece não ter texto extraível - pode ser uma imagem');
                    }
                    
                    resolve(textoCompleto.trim());
                    
                } catch (error) {
                    reject(new Error(`Erro ao processar PDF: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo PDF'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    async extrairTextoWord(file) {
        // Para arquivos Word, tentaremos uma extração básica
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    let texto = '';
                    
                    if (file.name.toLowerCase().endsWith('.docx')) {
                        // Para DOCX, fazemos uma extração básica via XML
                        const arrayBuffer = e.target.result;
                        const view = new Uint8Array(arrayBuffer);
                        
                        // Converter para string e extrair texto visível
                        let fullText = '';
                        try {
                            const decoder = new TextDecoder('utf-8');
                            fullText = decoder.decode(view);
                        } catch (decodingError) {
                            // Tentar com latin-1 se UTF-8 falhar
                            const decoder = new TextDecoder('latin-1');
                            fullText = decoder.decode(view);
                        }
                        
                        // Extrair texto entre tags XML (aproximação simples)
                        const matches = fullText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
                        if (matches) {
                            texto = matches
                                .map(match => match.replace(/<[^>]*>/g, ''))
                                .join(' ')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');
                        }
                        
                        // Se não encontrou XML, tentar extração de texto bruto
                        if (!texto || texto.length < 10) {
                            texto = fullText.replace(/[^\x20-\x7E\u00C0-\u017F]/g, ' ');
                        }
                        
                    } else {
                        // Para DOC antigo, extração mais básica
                        const arrayBuffer = e.target.result;
                        const view = new Uint8Array(arrayBuffer);
                        
                        // Tentar diferentes encodings
                        let decoder = new TextDecoder('utf-8', { ignoreBOM: true });
                        texto = decoder.decode(view);
                        
                        // Limpar caracteres de controle
                        texto = texto.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
                    }
                    
                    // Limpar e validar texto
                    texto = texto.replace(/\s+/g, ' ').trim();
                    
                    if (texto.length < 10) {
                        throw new Error('Pouco texto extraído do documento Word');
                    }
                    
                    resolve(texto);
                    
                } catch (error) {
                    reject(new Error(`Erro ao processar documento Word: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo Word'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    async extrairTextoSimples(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    let texto = e.target.result;
                    
                    // Se for HTML, remover tags
                    if (file.type === 'text/html' || file.name.toLowerCase().endsWith('.html')) {
                        // Remover scripts e styles
                        texto = texto.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                        texto = texto.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
                        
                        // Remover outras tags HTML
                        texto = texto.replace(/<[^>]*>/g, ' ');
                        
                        // Decodificar entidades HTML
                        texto = texto.replace(/&nbsp;/g, ' ');
                        texto = texto.replace(/&lt;/g, '<');
                        texto = texto.replace(/&gt;/g, '>');
                        texto = texto.replace(/&amp;/g, '&');
                        texto = texto.replace(/&quot;/g, '"');
                        texto = texto.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
                        texto = texto.replace(/&[a-zA-Z0-9#]+;/g, ' ');
                    }
                    
                    // Limpar espaços excessivos
                    texto = texto.replace(/\s+/g, ' ').trim();
                    
                    if (texto.length < 5) {
                        throw new Error('Arquivo de texto muito pequeno ou vazio');
                    }
                    
                    resolve(texto);
                    
                } catch (error) {
                    reject(new Error(`Erro ao processar arquivo de texto: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo de texto'));
            
            // Tentar diferentes encodings
            try {
                reader.readAsText(file, 'utf-8');
            } catch (error) {
                try {
                    reader.readAsText(file, 'latin-1');
                } catch (error2) {
                    reader.readAsText(file);
                }
            }
        });
    }
    
    async extrairTextoOCR(file) {
        // Verificar se Tesseract está disponível
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js não está carregado - OCR não disponível');
        }
        
        return new Promise((resolve, reject) => {
            // Timeout para OCR
            const timeout = setTimeout(() => {
                reject(new Error('Timeout do OCR - processo muito demorado'));
            }, this.config.processingTimeout);
            
            this.mostrarStatus('Executando OCR (reconhecimento de texto)...');
            
            const worker = Tesseract.createWorker({
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progresso = Math.floor(m.progress * 100);
                        this.mostrarStatus(`OCR: ${progresso}% concluído`);
                    }
                }
            });
            
            (async () => {
                try {
                    await worker.load();
                    await worker.loadLanguage(this.config.ocrLanguages.join('+'));
                    await worker.initialize(this.config.ocrLanguages.join('+'));
                    
                    const { data: { text } } = await worker.recognize(file);
                    await worker.terminate();
                    
                    clearTimeout(timeout);
                    
                    if (text.trim().length < 10) {
                        reject(new Error('OCR extraiu muito pouco texto - documento pode estar ilegível ou em branco'));
                    } else {
                        resolve(text.trim());
                    }
                    
                } catch (error) {
                    await worker.terminate();
                    clearTimeout(timeout);
                    reject(new Error(`Erro no OCR: ${error.message}`));
                }
            })();
        });
    }
    
    exibirTextoExtraido() {
        const textoDiv = document.getElementById('textoExtraido');
        const conteudoDiv = document.getElementById('textoConteudo');
        
        if (textoDiv && conteudoDiv) {
            // Limitar texto exibido para performance
            const textoExibir = this.state.extractedText.length > 5000 
                ? this.state.extractedText.substring(0, 5000) + '...\n\n[TEXTO TRUNCADO PARA EXIBIÇÃO - Texto completo será usado na análise]'
                : this.state.extractedText;
            
            conteudoDiv.textContent = textoExibir;
            textoDiv.style.display = 'block';
            
            // Animar entrada
            textoDiv.style.opacity = '0';
            textoDiv.style.transform = 'translateY(20px)';
            textoDiv.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                textoDiv.style.opacity = '1';
                textoDiv.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    habilitarBotaoProcessar() {
        const btnProcessar = document.getElementById('btnProcessarIA');
        if (btnProcessar) {
            btnProcessar.disabled = false;
            btnProcessar.style.opacity = '1';
            btnProcessar.classList.add('btn-enabled');
        }
    }
    
    processarComIA() {
        if (!this.state.extractedText.trim()) {
            this.mostrarErro('Nenhum texto disponível para processar.');
            return;
        }
        
        // Tentar extrair dados automaticamente primeiro
        const dadosExtraidos = this.extrairDadosAutomaticamente();
        
        if (dadosExtraidos && Object.keys(dadosExtraidos).length > 0) {
            this.preencherCamposAutomatico(dadosExtraidos);
        } else {
            this.mostrarPromptIA();
        }
    }
    
    extrairDadosAutomaticamente() {
        const texto = this.state.extractedText;
        const textoLower = texto.toLowerCase();
        const dados = {};
        
        try {
            // Extrair número do processo
            for (const pattern of this.patterns.numeroProcesso) {
                const match = texto.match(pattern);
                if (match) {
                    dados.numeroProcesso = match[1] || match[0];
                    break;
                }
            }
            
            // Extrair nomes (autor e réu)
            const nomes = [];
            for (const pattern of this.patterns.nomesPessoas) {
                const matches = [...texto.matchAll(pattern)];
                for (const match of matches) {
                    if (match[1] && match[1].length > 3) {
                        nomes.push({
                            tipo: match[0].toLowerCase().includes('autor') || match[0].toLowerCase().includes('requerente') ? 'autor' : 'reu',
                            nome: this.limparNome(match[1])
                        });
                    }
                }
            }
            
            // Atribuir nomes
            const autor = nomes.find(n => n.tipo === 'autor');
            const reu = nomes.find(n => n.tipo === 'reu');
            
            if (autor) dados.autor = autor.nome;
            if (reu) dados.reu = reu.nome;
            
            // Extrair pedidos
            for (const pattern of this.patterns.pedidos) {
                const match = textoLower.match(pattern);
                if (match && match[1]) {
                    dados.pedido = this.limparTexto(match[1]);
                    break;
                }
            }
            
            // Extrair decisões
            for (const pattern of this.patterns.decisoes) {
                const match = textoLower.match(pattern);
                if (match && match[1]) {
                    dados.decisao = this.limparTexto(match[1]);
                    break;
                }
            }
            
            return dados;
            
        } catch (error) {
            console.error('Erro na extração automática:', error);
            return {};
        }
    }
    
    limparNome(nome) {
        return nome
            .replace(/[^\w\sÀ-ÿ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(palavra => {
                if (palavra.length > 2) {
                    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
                }
                return palavra.toLowerCase();
            })
            .join(' ');
    }
    
    limparTexto(texto) {
        return texto
            .replace(/\s+/g, ' ')
            .replace(/[^\w\sÀ-ÿ.,!?;:()"\'-]/g, '')
            .trim();
    }
    
    preencherCamposAutomatico(dados = null) {
        const dadosParaPreencher = dados || this.extrairDadosAutomaticamente();
        
        if (!dadosParaPreencher || Object.keys(dadosParaPreencher).length === 0) {
            this.mostrarErro('Não foi possível extrair dados automaticamente. Use "Copiar para IA".');
            this.mostrarPromptIA();
            return;
        }
        
        let camposPreenchidos = 0;
        
        // Preencher campos do formulário
        Object.entries(dadosParaPreencher).forEach(([campo, valor]) => {
            const elemento = document.getElementById(campo);
            if (elemento && valor && valor.toString().trim()) {
                elemento.value = valor;
                camposPreenchidos++;
                
                // Trigger evento para atualizar a decisão
                elemento.dispatchEvent(new Event('input', { bubbles: true }));
                elemento.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        if (camposPreenchidos > 0) {
            // Voltar para aba do gerador
            if (window.sistemaSimplesMagico) {
                window.sistemaSimplesMagico.showTab('gerador');
            }
            
            this.mostrarSucesso(`✨ ${camposPreenchidos} campo(s) preenchido(s) automaticamente!`);
            
            // Mostrar dados extraídos
            setTimeout(() => {
                this.mostrarDadosExtraidos(dadosParaPreencher);
            }, 1000);
        } else {
            this.mostrarErro('Não foi possível preencher nenhum campo automaticamente.');
            this.mostrarPromptIA();
        }
    }
    
    mostrarDadosExtraidos(dados) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const dadosHTML = Object.entries(dados)
            .map(([campo, valor]) => `
                <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    <strong style="color: #2c3e50;">${this.obterLabelCampo(campo)}:</strong><br>
                    <span style="color: #666; font-size: 14px;">${valor}</span>
                </div>
            `).join('');
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🤖 Dados Extraídos Automaticamente
                </h3>
                
                <div style="margin-bottom: 20px;">
                    ${dadosHTML}
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 14px; color: #155724;">
                        ✅ <strong>Campos preenchidos com sucesso!</strong><br>
                        Verifique se as informações estão corretas e complete os campos restantes manualmente.
                    </p>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✅ Entendi!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    obterLabelCampo(campo) {
        const labels = {
            numeroProcesso: 'Número do Processo',
            autor: 'Autor',
            reu: 'Réu',
            pedido: 'O que foi pedido',
            decisao: 'Como foi decidido',
            motivo: 'Por que foi decidido',
            resultado: 'Resultado/O que acontece agora'
        };
        
        return labels[campo] || campo;
    }
    
    mostrarPromptIA() {
        const prompt = this.gerarPromptIA();
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 700px; width: 95%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🤖 Prompt para IA
                </h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; border: 1px solid #dee2e6;">${prompt}</div>
                
                <div style="margin: 20px 0;">
                    <h5 style="color: #2c3e50; margin-bottom: 10px;">🎯 Como usar:</h5>
                    <ol style="padding-left: 20px; line-height: 1.6; font-size: 14px;">
                        <li><strong>Copie</strong> o texto acima (botão abaixo)</li>
                        <li><strong>Cole</strong> no ChatGPT, Claude ou outra IA</li>
                        <li><strong>Copie</strong> a resposta da IA</li>
                        <li><strong>Preencha</strong> os campos manualmente no formulário</li>
                    </ol>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`).then(() => { alert('✅ Prompt copiado para área de transferência!'); })" 
                            style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        📋 Copiar Prompt
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    gerarPromptIA() {
        return `Analise esta sentença/documento jurídico e extraia as seguintes informações em linguagem simples e clara:

**INSTRUÇÕES:**
1. **Número do processo:** [extrair número completo]
2. **Autor:** [nome completo da pessoa/empresa que está pedindo]
3. **Réu:** [nome completo da pessoa/empresa contra quem se pede]
4. **O que foi pedido:** [explicar em linguagem simples o que o autor quer]
5. **Como decidiu:** [explicar a decisão do juiz de forma clara]
6. **Por que decidiu:** [explicar o motivo/fundamento da decisão]
7. **Resultado:** [o que acontece agora, prazos, consequências]

**IMPORTANTE:**
- Use linguagem simples, como se estivesse explicando para uma pessoa comum
- Evite termos jurídicos complexos
- Seja claro e objetivo
- Se alguma informação não estiver clara, indique como [NÃO IDENTIFICADO]

**DOCUMENTO PARA ANÁLISE:**

${this.state.extractedText}

---

**RESPOSTA ESPERADA:**
Forneça as informações no formato acima, usando linguagem simples e acessível.`;
    }
    
    mostrarStatus(mensagem) {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.textContent = mensagem;
            statusElement.style.color = '#007bff';
            statusElement.style.fontWeight = '600';
        }
    }
    
    mostrarProgresso(porcentagem) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        if (progressBar && progressFill) {
            progressBar.style.display = 'block';
            progressFill.style.width = porcentagem + '%';
            
            // Animação suave
            progressFill.style.transition = 'width 0.3s ease';
            
            // Cor baseada no progresso
            if (porcentagem < 30) {
                progressFill.style.background = '#dc3545';
            } else if (porcentagem < 70) {
                progressFill.style.background = '#ffc107';
            } else {
                progressFill.style.background = '#28a745';
            }
        }
    }
    
    ocultarProgresso() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 1000);
        }
    }
    
    mostrarSucesso(mensagem) {
        this.mostrarNotificacao(mensagem, 'success');
    }
    
    mostrarErro(mensagem) {
        this.mostrarNotificacao(mensagem, 'error');
    }
    
    mostrarNotificacao(mensagem, tipo = 'info') {
        const cores = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        const icones = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${cores[tipo]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            max-width: 350px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            line-height: 1.4;
            transform: translateX(100%);
        `;
        
        toast.textContent = `${icones[tipo]} ${mensagem}`;
        document.body.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após tempo baseado no tipo
        const duracao = tipo === 'error' ? 8000 : tipo === 'success' ? 5000 : 4000;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duracao);
    }
    
    // Método para limpar estado
    limparEstado() {
        this.state.extractedText = '';
        this.state.currentFiles = [];
        this.state.processedData = null;
        this.state.isProcessing = false;
        
        const textoDiv = document.getElementById('textoExtraido');
        if (textoDiv) {
            textoDiv.style.display = 'none';
        }
        
        const btnProcessar = document.getElementById('btnProcessarIA');
        if (btnProcessar) {
            btnProcessar.disabled = true;
            btnProcessar.classList.remove('btn-enabled');
        }
        
        this.ocultarProgresso();
        
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.textContent = '';
        }
    }
    
    // Método público para destruição
    destruir() {
        this.limparEstado();
        
        // Remover event listeners se necessário
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.removeEventListener('change', this.handleFileSelect);
        }
        
        console.log('📁 Sistema de Upload finalizado');
    }
}

// Funções globais para serem chamadas pelo HTML
window.copiarTextoIA = function() {
    if (!window.uploadProcessor || !window.uploadProcessor.state.extractedText) {
        alert('Nenhum texto extraído disponível.');
        return;
    }
    
    const prompt = window.uploadProcessor.gerarPromptIA();
    
    navigator.clipboard.writeText(prompt).then(() => {
        // Criar notificação customizada
        const toast = document.createElement('div');
        toast.textContent = '📋 Prompt copiado! Cole no ChatGPT ou Claude para análise.';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transition: all 0.3s ease;
            transform: translateY(-20px);
        `;
        
        document.body.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 100);
        
        // Remover após 4 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
        
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar para área de transferência. Tente selecionar e copiar manualmente.');
    });
};

window.preencherCamposAutomatico = function() {
    if (!window.uploadProcessor) {
        alert('Sistema de upload não inicializado.');
        return;
    }
    
    window.uploadProcessor.preencherCamposAutomatico();
};

// Inicializar processador de upload quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        window.uploadProcessor = new UploadProcessor();
        console.log('📁 Sistema de Upload e OCR inicializado!');
    }, 500);
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', function() {
    if (window.uploadProcessor) {
        window.uploadProcessor.destruir();
    }
});