/**
 * Módulo Gravador de Áudio - Sistema Simples e Mágico
 * Versão 2.0 - Corrigida e Melhorada
 * Funcionalidades avançadas de gravação, processamento e exportação de áudio
 * Com compatibilidade cross-browser e dispositivos móveis
 */

class GravadorAudio {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioStream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPauseTime = 0;
        this.timerInterval = null;
        this.visualizerInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        
        // Detectar dispositivo
        this.dispositivo = this.detectarDispositivo();
        
        // Configurações baseadas no dispositivo
        this.config = {
            mimeType: this.obterMimeTypeCompativel(),
            audioBitsPerSecond: 128000,
            sampleRate: 44100,
            channelCount: 1,
            maxDuration: 600000, // 10 minutos
            visualizerBars: 20
        };
        
        this.init();
    }
    
    /**
     * Detectar navegador e sistema operacional
     */
    detectarDispositivo() {
        const userAgent = navigator.userAgent;
        
        return {
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            isChrome: /Chrome/.test(userAgent),
            isMobile: /Mobi|Android/i.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            isEdge: /Edge/.test(userAgent)
        };
    }
    
    /**
     * Obter MIME type compatível com o dispositivo
     */
    obterMimeTypeCompativel() {
        const formatos = [];
        
        if (this.dispositivo.isIOS) {
            // iOS prefere formatos específicos
            formatos.push('audio/mp4', 'audio/wav', 'audio/webm');
        } else if (this.dispositivo.isAndroid) {
            // Android geralmente suporta webm
            formatos.push('audio/webm;codecs=opus', 'audio/webm', 'audio/mp4');
        } else {
            // Desktop - ordem de preferência
            formatos.push('audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav');
        }
        
        // Testar suporte
        for (const formato of formatos) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(formato)) {
                return formato;
            }
        }
        
        // Fallback
        return 'audio/webm';
    }
    
    init() {
        this.setupEventListeners();
        this.createAudioVisualizer();
        this.checkBrowserSupport();
    }
    
    setupEventListeners() {
        // Botões de controle
        const btnIniciar = document.getElementById('btnIniciarGravacao');
        const btnParar = document.getElementById('btnPararGravacao');
        const btnReproducir = document.getElementById('btnReproducir');
        const btnPausar = document.getElementById('btnPausarGravacao');
        const btnBaixar = document.getElementById('btnBaixarAudio');
        const btnQR = document.getElementById('btnGerarQRAudio');
        
        if (btnIniciar) btnIniciar.addEventListener('click', () => this.iniciarGravacao());
        if (btnParar) btnParar.addEventListener('click', () => this.pararGravacao());
        if (btnPausar) btnPausar.addEventListener('click', () => this.pausarGravacao());
        if (btnReproducir) btnReproducir.addEventListener('click', () => this.reproduzirAudio());
        if (btnBaixar) btnBaixar.addEventListener('click', () => this.baixarAudio());
        if (btnQR) btnQR.addEventListener('click', () => this.gerarQRAudio());
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Só ativar atalhos quando estiver na aba do gravador
            if (window.sistemaSimplesMagico && window.sistemaSimplesMagico.state.currentTab !== 'gravador') {
                return;
            }
            
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.isRecording ? this.pararGravacao() : this.iniciarGravacao();
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.iniciarGravacao();
                    }
                    break;
                case 'p':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.reproduzirAudio();
                    }
                    break;
                case 'escape':
                    if (this.isRecording) {
                        this.pararGravacao();
                    }
                    break;
            }
        });
        
        // Controle de volume do player
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.addEventListener('loadedmetadata', () => {
                this.atualizarDuracaoAudio();
            });
            
            audioPlayer.addEventListener('timeupdate', () => {
                this.atualizarProgressoReproducao();
            });
            
            audioPlayer.addEventListener('ended', () => {
                this.mostrarNotificacao('🎵 Reprodução finalizada');
            });
            
            audioPlayer.addEventListener('error', (e) => {
                console.error('Erro no player de áudio:', e);
                this.mostrarErro('Erro ao reproduzir áudio. Verifique o formato do arquivo.');
            });
        }
    }
    
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.mostrarErro('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Safari recentes.');
            return false;
        }
        
        if (!window.MediaRecorder) {
            this.mostrarErro('MediaRecorder não suportado. Atualize seu navegador.');
            return false;
        }
        
        // Verificar suporte ao formato escolhido
        if (!MediaRecorder.isTypeSupported || !MediaRecorder.isTypeSupported(this.config.mimeType)) {
            console.warn(`Formato ${this.config.mimeType} não suportado, usando fallback`);
            this.config.mimeType = 'audio/webm';
        }
        
        return true;
    }
    
    async iniciarGravacao() {
        try {
            if (!this.checkBrowserSupport()) return;
            
            // Solicitar permissão para microfone com configurações otimizadas
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: this.config.sampleRate,
                    channelCount: this.config.channelCount
                }
            };
            
            // Para dispositivos móveis, usar configurações mais simples
            if (this.dispositivo.isMobile) {
                constraints.audio = {
                    echoCancellation: true,
                    noiseSuppression: true
                };
            }
            
            this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Configurar MediaRecorder
            const mediaRecorderOptions = {
                mimeType: this.config.mimeType
            };
            
            // Adicionar bitrate apenas se suportado
            if (!this.dispositivo.isIOS) {
                mediaRecorderOptions.audioBitsPerSecond = this.config.audioBitsPerSecond;
            }
            
            this.mediaRecorder = new MediaRecorder(this.audioStream, mediaRecorderOptions);
            
            // Resetar dados
            this.audioChunks = [];
            this.audioBlob = null;
            this.totalPauseTime = 0;
            
            // Event listeners do MediaRecorder
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.finalizarGravacao();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('Erro do MediaRecorder:', event);
                this.mostrarErro('Erro durante a gravação: ' + (event.error || 'Erro desconhecido'));
                this.resetarEstadoGravacao();
            };
            
            this.mediaRecorder.onstart = () => {
                this.mostrarNotificacao('🎤 Gravação iniciada!');
            };
            
            // Iniciar gravação
            const timeslice = this.dispositivo.isMobile ? 2000 : 1000; // Intervalos maiores para mobile
            this.mediaRecorder.start(timeslice);
            this.isRecording = true;
            this.startTime = Date.now();
            
            // Atualizar UI
            this.atualizarStatusGravacao('🔴 Gravando... Fale agora!');
            this.atualizarBotoesGravacao(true);
            
            // Iniciar timer e visualizador
            this.iniciarTimer();
            this.iniciarVisualizador();
            
            // Auto-parar após tempo máximo
            this.autoStopTimeout = setTimeout(() => {
                if (this.isRecording) {
                    this.pararGravacao();
                    this.mostrarNotificacao('⏰ Gravação parada automaticamente (tempo máximo atingido)');
                }
            }, this.config.maxDuration);
            
        } catch (error) {
            this.tratarErroGravacao(error);
        }
    }
    
    pausarGravacao() {
        if (!this.isRecording || this.isPaused) return;
        
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.pause();
                this.isPaused = true;
                this.pauseTime = Date.now();
                
                this.atualizarStatusGravacao('⏸️ Gravação pausada');
                this.pararVisualizador();
                
                this.mostrarNotificacao('⏸️ Gravação pausada');
            }
        } catch (error) {
            console.error('Erro ao pausar gravação:', error);
        }
    }
    
    retomarGravacao() {
        if (!this.isRecording || !this.isPaused) return;
        
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
                this.mediaRecorder.resume();
                this.isPaused = false;
                this.totalPauseTime += Date.now() - this.pauseTime;
                
                this.atualizarStatusGravacao('🔴 Gravando... Fale agora!');
                this.iniciarVisualizador();
                
                this.mostrarNotificacao('▶️ Gravação retomada');
            }
        } catch (error) {
            console.error('Erro ao retomar gravação:', error);
        }
    }
    
    pararGravacao() {
        if (!this.isRecording) return;
        
        try {
            // Limpar timeout de auto-stop
            if (this.autoStopTimeout) {
                clearTimeout(this.autoStopTimeout);
                this.autoStopTimeout = null;
            }
            
            if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
                this.mediaRecorder.stop();
            }
            
            this.isRecording = false;
            this.isPaused = false;
            
            // Parar stream
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }
            
            // Parar timer e visualizador
            this.pararTimer();
            this.pararVisualizador();
            
            // Atualizar UI
            this.atualizarStatusGravacao('⏹️ Processando gravação...');
            this.atualizarBotoesGravacao(false);
            
        } catch (error) {
            console.error('Erro ao parar gravação:', error);
            this.mostrarErro('Erro ao parar gravação: ' + error.message);
            this.resetarEstadoGravacao();
        }
    }
    
    finalizarGravacao() {
        try {
            // Criar blob de áudio
            this.audioBlob = new Blob(this.audioChunks, { 
                type: this.config.mimeType 
            });
            
            // Verificar se o blob foi criado corretamente
            if (this.audioBlob.size === 0) {
                throw new Error('Áudio gravado está vazio');
            }
            
            // Criar URL para reprodução
            const audioURL = URL.createObjectURL(this.audioBlob);
            
            // Configurar player
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.src = audioURL;
                audioPlayer.style.display = 'block';
            }
            
            // Calcular duração
            const duracao = Math.floor((Date.now() - this.startTime - this.totalPauseTime) / 1000);
            
            // Atualizar UI
            this.atualizarStatusGravacao(`✅ Gravação concluída! Duração: ${this.formatarTempo(duracao)}`);
            this.habilitarBotoesReproducao(true);
            
            // Incrementar estatística
            if (window.sistemaSimplesMagico) {
                window.sistemaSimplesMagico.incrementarEstatistica('audiosGravados');
            }
            
            // Notificação de sucesso
            this.mostrarSucesso(`🎉 Gravação concluída! Duração: ${this.formatarTempo(duracao)}`);
            
            // Mostrar dicas de uso
            setTimeout(() => {
                this.mostrarDicasUso();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao finalizar gravação:', error);
            this.mostrarErro('Erro ao finalizar gravação: ' + error.message);
            this.resetarEstadoGravacao();
        }
    }
    
    reproduzirAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && this.audioBlob) {
            if (audioPlayer.paused) {
                audioPlayer.play().then(() => {
                    this.mostrarNotificacao('▶️ Reproduzindo áudio...');
                }).catch(error => {
                    console.error('Erro ao reproduzir:', error);
                    this.mostrarErro('Erro ao reproduzir áudio');
                });
            } else {
                audioPlayer.pause();
                this.mostrarNotificacao('⏸️ Áudio pausado');
            }
        } else {
            this.mostrarErro('Nenhum áudio disponível para reprodução');
        }
    }
    
    async baixarAudio() {
        if (!this.audioBlob) {
            this.mostrarErro('Nenhum áudio gravado para baixar');
            return;
        }
        
        try {
            // Converter para formato compatível se necessário
            const audioFinal = await this.converterParaFormatoCompativel(this.audioBlob);
            
            // Nome do arquivo baseado no dispositivo
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const extensao = this.obterExtensaoArquivo();
            const nomeArquivo = `audio-decisao-${timestamp}.${extensao}`;
            
            // Criar link de download
            const url = URL.createObjectURL(audioFinal);
            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.mostrarSucesso(`💾 Áudio baixado: ${nomeArquivo}`);
            
            // Mostrar instruções de uso
            setTimeout(() => {
                this.mostrarInstrucoesUpload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao baixar áudio:', error);
            this.mostrarErro('Erro ao baixar áudio: ' + error.message);
        }
    }
    
    /**
     * Obter extensão do arquivo baseada no formato
     */
    obterExtensaoArquivo() {
        if (this.config.mimeType.includes('mp4')) return 'mp4';
        if (this.config.mimeType.includes('wav')) return 'wav';
        if (this.config.mimeType.includes('webm')) return 'webm';
        return 'audio';
    }
    
    /**
     * Converter áudio para formato compatível
     */
    async converterParaFormatoCompativel(audioBlob) {
        // Para iOS, tentar converter para formato mais compatível
        if (this.dispositivo.isIOS) {
            try {
                return await this.converterParaWAV(audioBlob);
            } catch (error) {
                console.warn('Conversão para WAV falhou, usando formato original:', error);
                return audioBlob;
            }
        }
        
        // Para outros dispositivos, retornar original
        return audioBlob;
    }
    
    /**
     * Converter para WAV usando Web Audio API
     */
    async converterParaWAV(audioBlob) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Converter para WAV
            const wavBlob = this.audioBufferToWav(audioBuffer);
            return wavBlob;
        } catch (error) {
            throw new Error('Conversão para WAV não suportada: ' + error.message);
        }
    }
    
    /**
     * Converter AudioBuffer para WAV
     */
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // Função auxiliar para escrever strings
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        // Cabeçalho WAV
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Dados de áudio
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    gerarQRAudio() {
        const modal = this.criarModalQR();
        document.body.appendChild(modal);
        
        // Mostrar modal com animação
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }
    
    criarModalQR() {
        const modal = document.createElement('div');
        modal.className = 'modal-qr';
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
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const dispositivoInfo = this.dispositivo.isIOS ? 
            '<p style="color: #e74c3c; font-size: 12px; margin-top: 10px;">📱 <strong>iOS:</strong> Para melhor compatibilidade, use Google Drive ou Dropbox</p>' : 
            '';
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🎧 Gerar QR Code do Áudio
                </h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                        📎 Cole o link do áudio na nuvem:
                    </label>
                    <input type="url" id="linkAudioQR" placeholder="https://drive.google.com/..." 
                           style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Exemplo: Google Drive, Dropbox, OneDrive, SoundCloud, etc.
                    </div>
                    ${dispositivoInfo}
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h5 style="color: #2c3e50; margin-bottom: 10px;">💡 Plataformas Recomendadas:</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                        <div>🌐 <strong>Google Drive</strong><br>Mais compatível</div>
                        <div>📦 <strong>Dropbox</strong><br>Fácil compartilhamento</div>
                        <div>☁️ <strong>OneDrive</strong><br>Integração Microsoft</div>
                        <div>🎵 <strong>SoundCloud</strong><br>Especializado em áudio</div>
                    </div>
                </div>
                
                <div id="qrPreview" style="text-align: center; margin: 20px 0; display: none;">
                    <img id="qrImage" style="max-width: 200px; border: 2px solid #2c3e50; border-radius: 8px;">
                    <p style="margin-top: 10px; color: #666;">Escaneie para ouvir o áudio</p>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Cancelar
                    </button>
                    <button onclick="gerarQRDoAudio()" 
                            style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        🎯 Gerar QR Code
                    </button>
                    <button onclick="usarAudioNoFormulario()" 
                            style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        ✨ Usar no Formulário
                    </button>
                </div>
            </div>
        `;
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    iniciarTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            
            const tempoDecorrido = Date.now() - this.startTime - this.totalPauseTime;
            const segundos = Math.floor(tempoDecorrido / 1000);
            
            const tempoElement = document.getElementById('tempoGravacao');
            if (tempoElement) {
                tempoElement.textContent = this.formatarTempo(segundos);
                
                // Mudar cor baseado na duração
                if (segundos > 300) { // 5 minutos
                    tempoElement.style.color = '#e74c3c';
                } else if (segundos > 180) { // 3 minutos
                    tempoElement.style.color = '#f39c12';
                } else {
                    tempoElement.style.color = '#2c3e50';
                }
            }
        }, 1000);
    }
    
    pararTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    iniciarVisualizador() {
        if (!this.audioStream) return;
        
        try {
            // Configurar Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.microphone.connect(this.analyser);
            
            // Iniciar visualização
            this.visualizerInterval = setInterval(() => {
                this.atualizarVisualizador();
            }, 100);
            
        } catch (error) {
            console.warn('Erro ao iniciar visualizador:', error);
            // Continuar sem visualizador
        }
    }
    
    pararVisualizador() {
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.warn);
            this.audioContext = null;
        }
        
        // Resetar visualizador
        this.resetarVisualizador();
    }
    
    createAudioVisualizer() {
        const statusElement = document.getElementById('statusGravacao');
        if (!statusElement || document.getElementById('audioVisualizer')) return;
        
        const visualizerContainer = document.createElement('div');
        visualizerContainer.id = 'audioVisualizer';
        visualizerContainer.className = 'audio-visualizer';
        visualizerContainer.style.display = 'none';
        
        // Criar barras do visualizador
        for (let i = 0; i < this.config.visualizerBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            bar.style.cssText = `
                width: 4px;
                height: 5px;
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
                transition: height 0.1s ease, background-color 0.1s ease;
            `;
            visualizerContainer.appendChild(bar);
        }
        
        // Inserir após o status de gravação
        statusElement.parentNode.insertBefore(visualizerContainer, statusElement.nextSibling);
    }
    
    atualizarVisualizador() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        const visualizer = document.getElementById('audioVisualizer');
        if (!visualizer) return;
        
        visualizer.style.display = 'flex';
        const bars = visualizer.querySelectorAll('.audio-bar');
        
        bars.forEach((bar, index) => {
            const dataIndex = Math.floor(index * bufferLength / bars.length);
            const amplitude = dataArray[dataIndex];
            const height = Math.max(5, (amplitude / 255) * 40);
            
            bar.style.height = height + 'px';
            
            if (amplitude > 50) {
                bar.classList.add('active');
                bar.style.background = 'white';
                bar.style.boxShadow = '0 0 5px rgba(255,255,255,0.5)';
            } else {
                bar.classList.remove('active');
                bar.style.background = 'rgba(255,255,255,0.3)';
                bar.style.boxShadow = 'none';
            }
        });
    }
    
    resetarVisualizador() {
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            const bars = visualizer.querySelectorAll('.audio-bar');
            bars.forEach(bar => {
                bar.style.height = '5px';
                bar.classList.remove('active');
                bar.style.background = 'rgba(255,255,255,0.3)';
                bar.style.boxShadow = 'none';
            });
            visualizer.style.display = 'none';
        }
    }
    
    atualizarStatusGravacao(status) {
        const statusElement = document.getElementById('statusGravacao');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Adicionar classe baseada no status
            statusElement.className = 'status-gravacao';
            if (status.includes('Gravando')) {
                statusElement.classList.add('gravando');
            }
        }
    }
    
    atualizarBotoesGravacao(gravando) {
        const btnIniciar = document.getElementById('btnIniciarGravacao');
        const btnParar = document.getElementById('btnPararGravacao');
        
        if (btnIniciar) {
            btnIniciar.disabled = gravando;
            btnIniciar.textContent = gravando ? '🔴 Gravando...' : '🎤 Gravar';
        }
        
        if (btnParar) {
            btnParar.disabled = !gravando;
        }
    }
    
    habilitarBotoesReproducao(habilitar) {
        const botoes = ['btnReproducir', 'btnBaixarAudio', 'btnGerarQRAudio'];
        
        botoes.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !habilitar;
            }
        });
    }
    
    atualizarDuracaoAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && !isNaN(audioPlayer.duration)) {
            const duracao = Math.floor(audioPlayer.duration);
            console.log(`Áudio carregado - Duração: ${this.formatarTempo(duracao)}`);
        }
    }
    
    atualizarProgressoReproducao() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && audioPlayer.duration) {
            const progresso = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            // Aqui poderia atualizar uma barra de progresso se existisse
        }
    }
    
    tratarErroGravacao(error) {
        console.error('Erro de gravação:', error);
        
        let mensagem = 'Erro ao iniciar gravação: ';
        
        switch(error.name) {
            case 'NotAllowedError':
                mensagem += 'Permissão negada. Permita o acesso ao microfone nas configurações do navegador.';
                break;
            case 'NotFoundError':
                mensagem += 'Microfone não encontrado. Verifique se está conectado e funcionando.';
                break;
            case 'NotReadableError':
                mensagem += 'Microfone está sendo usado por outro aplicativo. Feche outros programas que possam estar usando o microfone.';
                break;
            case 'OverconstrainedError':
                mensagem += 'Configurações de áudio não suportadas pelo seu dispositivo.';
                break;
            case 'SecurityError':
                mensagem += 'Erro de segurança. Certifique-se de que está usando HTTPS.';
                break;
            default:
                mensagem += error.message || 'Erro desconhecido. Tente novamente ou use outro navegador.';
        }
        
        this.mostrarErro(mensagem);
        this.resetarEstadoGravacao();
    }
    
    resetarEstadoGravacao() {
        this.isRecording = false;
        this.isPaused = false;
        this.atualizarStatusGravacao('🎤 Pronto para gravar');
        this.atualizarBotoesGravacao(false);
        this.pararTimer();
        this.pararVisualizador();
        
        // Limpar timeout se existir
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        // Resetar timer visual
        const tempoElement = document.getElementById('tempoGravacao');
        if (tempoElement) {
            tempoElement.textContent = '00:00';
            tempoElement.style.color = '#2c3e50';
        }
    }
    
    formatarTempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    
    mostrarDicasUso() {
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
        
        const dispositivoDicas = this.dispositivo.isIOS ? `
            <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h5 style="color: #17a2b8; margin-bottom: 10px;">📱 Dicas para iOS:</h5>
                <ul style="padding-left: 20px; margin: 0; line-height: 1.6;">
                    <li>Use <strong>Google Drive</strong> para melhor compatibilidade</li>
                    <li>Configure compartilhamento como "Qualquer pessoa com o link"</li>
                    <li>Use o formato de <strong>download direto</strong> quando possível</li>
                    <li>Teste o link em modo privado/anônimo</li>
                </ul>
            </div>
        ` : '';
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🎯 Como usar seu áudio
                </h3>
                
                <div style="line-height: 1.8; margin-bottom: 20px;">
                    <h4 style="color: #28a745; margin-bottom: 10px;">📤 1. Faça Upload para Nuvem:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🌐</div>
                            <strong>Google Drive</strong><br>
                            <small>drive.google.com</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; margin-bottom: 5px;">📦</div>
                            <strong>Dropbox</strong><br>
                            <small>dropbox.com</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; margin-bottom: 5px;">☁️</div>
                            <strong>OneDrive</strong><br>
                            <small>onedrive.live.com</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🎵</div>
                            <strong>SoundCloud</strong><br>
                            <small>soundcloud.com</small>
                        </div>
                    </div>
                    
                    ${dispositivoDicas}
                    
                    <h4 style="color: #007bff; margin-bottom: 10px;">🔗 2. Obtenha o Link Público:</h4>
                    <ul style="padding-left: 20px; margin-bottom: 15px; line-height: 1.6;">
                        <li>📂 Configure como "Qualquer pessoa com o link"</li>
                        <li>📋 Copie o link de compartilhamento</li>
                        <li>🔍 Teste o link em uma aba anônima</li>
                        <li>📱 Verifique se funciona no celular</li>
                    </ul>
                    
                    <h4 style="color: #dc3545; margin-bottom: 10px;">✨ 3. Use no Sistema:</h4>
                    <ul style="padding-left: 20px; line-height: 1.6;">
                        <li>📝 Cole o link no campo "Link do Áudio"</li>
                        <li>📱 QR Code será gerado automaticamente</li>
                        <li>🎧 Pessoas poderão ouvir escaneando o código</li>
                        <li>📄 Link aparecerá na decisão final</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
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
    
    mostrarInstrucoesUpload() {
        this.mostrarNotificacao('💡 Agora faça upload do arquivo para uma plataforma de nuvem e cole o link no formulário!');
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
            transition: opacity 0.3s ease;
            max-width: 350px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            line-height: 1.4;
        `;
        
        toast.textContent = mensagem;
        document.body.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => toast.style.opacity = '1', 100);
        
        // Remover após tempo baseado no tipo
        const duracao = tipo === 'error' ? 8000 : tipo === 'success' ? 5000 : 4000;
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duracao);
    }
    
    // Método público para limpeza
    destruir() {
        this.pararGravacao();
        this.pararTimer();
        this.pararVisualizador();
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioBlob) {
            URL.revokeObjectURL(this.audioBlob);
        }
        
        // Limpar elementos criados
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            visualizer.remove();
        }
    }
}

// Funções globais para os modais
window.gerarQRDoAudio = function() {
    const linkInput = document.getElementById('linkAudioQR');
    const link = linkInput.value.trim();
    
    if (!link) {
        alert('Por favor, cole o link do áudio primeiro.');
        return;
    }
    
    if (!link.startsWith('http')) {
        alert('Link inválido. Deve começar com http:// ou https://');
        return;
    }
    
    // Gerar QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&ecc=M&data=${encodeURIComponent(link)}`;
    
    const qrPreview = document.getElementById('qrPreview');
    const qrImage = document.getElementById('qrImage');
    
    if (qrPreview && qrImage) {
        qrImage.src = qrUrl;
        qrPreview.style.display = 'block';
        
        // Animação de entrada
        qrPreview.style.opacity = '0';
        qrPreview.style.transform = 'scale(0.8)';
        qrPreview.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            qrPreview.style.opacity = '1';
            qrPreview.style.transform = 'scale(1)';
        }, 100);
    }
};

window.usarAudioNoFormulario = function() {
    const linkInput = document.getElementById('linkAudioQR');
    const link = linkInput.value.trim();
    
    if (!link) {
        alert('Por favor, cole o link do áudio primeiro.');
        return;
    }
    
    if (!link.startsWith('http')) {
        alert('Link inválido. Deve começar com http:// ou https://');
        return;
    }
    
    // Preencher campo no formulário principal
    const linkAudioForm = document.getElementById('linkAudio');
    if (linkAudioForm) {
        linkAudioForm.value = link;
        
        // Trigger event para atualizar a decisão
        linkAudioForm.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fechar modal
    const modal = document.querySelector('.modal-qr');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
    
    // Ir para aba do gerador
    if (window.sistemaSimplesMagico) {
        window.sistemaSimplesMagico.showTab('gerador');
    }
    
    // Notificação de sucesso
    const toast = document.createElement('div');
    toast.textContent = '✅ Link do áudio adicionado ao formulário!';
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
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
};

// Inicializar gravador quando a página carregar
let gravadorAudio;
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que o DOM está completamente carregado
    setTimeout(() => {
        gravadorAudio = new GravadorAudio();
        console.log('🎙️ Gravador de áudio inicializado!');
    }, 1000);
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', function() {
    if (gravadorAudio) {
        gravadorAudio.destruir();
    }
});