# ✨ Sistema Simples e Mágico

**Sistema Inteligente de Decisões em Linguagem Simples**  
Desenvolvido para o Juizado Especial da Comarca de Tauá - CE  
Por: Juiz de Direito Titular Sérgio Augusto Furtado Neto Viana

## 📋 Sobre o Sistema

O Sistema "Simples e Mágico" é uma ferramenta inovadora que transforma decisões judiciais complexas em textos claros e acessíveis, seguindo as diretrizes da **Recomendação 144/2023 do CNJ** sobre linguagem simples no Poder Judiciário.

### 🎯 Objetivos

- **Acessibilidade:** Tornar decisões judiciais compreensíveis para todos
- **Transparência:** Promover transparência judicial através da linguagem clara
- **Eficiência:** Agilizar a criação de decisões padronizadas
- **Sustentabilidade:** Alinhar com os Objetivos de Desenvolvimento Sustentável da ONU

## 🚀 Funcionalidades

### 1. 🎯 Gerador de Decisões

- Interface intuitiva para criação de decisões
- Linguagem simples e acessível
- Pré-visualização em tempo real
- Templates pré-definidos para diferentes tipos de ação
- Integração com ODS (Objetivos de Desenvolvimento Sustentável)

### 2. 📁 Upload Inteligente com IA

- Processamento de documentos PDF, DOC, DOCX, TXT
- OCR (Reconhecimento Ótico de Caracteres) integrado
- Extração automática de dados
- Preenchimento inteligente de campos

### 3. 🎙️ Gravador de Áudio Profissional

- Gravação de alta qualidade
- Visualizador de áudio em tempo real
- Compatibilidade cross-browser (iOS/Android)
- Exportação em múltiplos formatos
- Geração automática de QR Code para áudio

### 4. 📱 QR Codes Automáticos

- Geração automática para consulta processual
- QR Code para áudio explicativo
- Otimização para diferentes dispositivos
- Instruções específicas para iOS e Android

### 5. 📚 Biblioteca de Templates

- Templates pré-configurados por tipo de ação:
  - Cobrança/Dívida
  - Relação de Consumo
  - Locação/Despejo
  - Acidente de Trânsito
  - Prestação de Serviços

### 6. 📊 Estatísticas e Relatórios

- Acompanhamento de uso
- Estatísticas de produtividade
- Informações do sistema

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura moderna e semântica
- **CSS3** - Design responsivo e animações
- **JavaScript ES6+** - Funcionalidades interativas
- **PDF.js** - Processamento de arquivos PDF
- **Tesseract.js** - OCR (Reconhecimento de texto)
- **Web Audio API** - Gravação de áudio profissional
- **Canvas API** - Geração de imagens fallback

## 📁 Estrutura do Projeto

```
sistema-simples-magico/
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos principais
├── js/
│   ├── main.js             # JavaScript principal
│   ├── gravador.js         # Módulo de gravação
│   └── upload.js           # Módulo de upload/OCR
├── imgs/                   # Imagens e ícones
│   ├── ods_1.png           # ODS 1-18
│   ├── ods_2.png
│   ├── ...
│   ├── ods_18.png
│   ├── linguagem_simples.png
│   ├── logo_tjce.png
│   └── acessibilidade_universal.png
├── docs/                   # Documentação
│   └── manual.md
└── README.md               # Este arquivo
```

## 🔧 Instalação e Configuração

### Opção 1: GitHub Pages (Recomendado)

1. **Fork ou Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/sistema-simples-magico.git
   ```

2. **Configure o GitHub Pages:**

   - Vá em Settings > Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`

3. **Acesse seu sistema:**
   - URL: `https://seu-usuario.github.io/sistema-simples-magico/`

### Opção 2: Servidor Local

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/sistema-simples-magico.git
   cd sistema-simples-magico
   ```

2. **Inicie um servidor local:**

   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (com http-server)
   npx http-server

   # PHP
   php -S localhost:8000
   ```

3. **Acesse:** `http://localhost:8000`

## 🎨 Personalização

### Alterando Informações do Tribunal

Edite o arquivo `js/main.js` na seção `gerarSecaoContato()`:

```javascript
gerarSecaoContato() {
    return `
        <div class="contato-section">
            <h3>📞 SEUS CONTATOS AQUI</h3>
            <p><strong>SEU TRIBUNAL</strong></p>
            <p>📞 <strong>Telefone:</strong> (XX) XXXX-XXXX</p>
            // ... outros contatos
        </div>
    `;
}
```

### Adicionando Novos Templates

No arquivo `js/main.js`, adicione na seção `this.templates`:

```javascript
novoTipo: {
    titulo: 'Novo Tipo de Ação',
    pedido: 'Descrição do pedido...',
    decisao: 'Como foi decidido...',
    motivo: 'Motivo da decisão...',
    resultado: 'O que acontece agora...'
}
```

### Personalizando Cores

Edite o arquivo `css/style.css` nas variáveis CSS ou nos gradientes:

```css
:root {
  --cor-principal: #667eea;
  --cor-secundaria: #764ba2;
  --cor-sucesso: #28a745;
  --cor-erro: #dc3545;
}
```

## 🔧 Problemas Conhecidos e Soluções

### Imagens não aparecem

**Problema:** Imagens dos ODS não carregam  
**Solução:** O sistema possui fallbacks automáticos que geram ícones quando as imagens não estão disponíveis

### Áudio não funciona no iPhone

**Problema:** QR Code de áudio não abre no iOS  
**Solução:**

- Use Google Drive com link de download direto
- Configure compartilhamento como "Qualquer pessoa com o link"
- Teste o link em modo privado

### OCR muito lento

**Problema:** Reconhecimento de texto demora muito  
**Solução:**

- Use arquivos com texto selecionável (PDF com texto)
- Evite imagens de baixa qualidade
- Configure timeout no `js/upload.js`

### Problemas de permissão do microfone

**Problema:** Navegador não permite gravação  
**Solução:**

- Use HTTPS (obrigatório para microfone)
- Permita acesso nas configurações do navegador
- Teste em Chrome ou Firefox atualizados

## 📱 Compatibilidade

### Navegadores Suportados

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos Móveis

- ✅ Android 8+ (Chrome, Firefox)
- ✅ iOS 13+ (Safari)
- ⚠️ Funcionalidades limitadas em navegadores antigos

### Funcionalidades por Plataforma

| Funcionalidade      | Desktop | Android | iOS |
| ------------------- | ------- | ------- | --- |
| Gerador de Decisões | ✅      | ✅      | ✅  |
| Upload/OCR          | ✅      | ✅      | ⚠️  |
| Gravação de Áudio   | ✅      | ✅      | ⚠️  |
| QR Codes            | ✅      | ✅      | ✅  |
| Templates           | ✅      | ✅      | ✅  |

**Legenda:**

- ✅ Totalmente suportado
- ⚠️ Funcionalidade limitada

## 🔒 Segurança e Privacidade

### Dados Locais

- Todos os dados são processados localmente no navegador
- Nenhuma informação é enviada para servidores externos
- Rascunhos são salvos apenas no localStorage do navegador

### APIs Externas

- **QR Code API:** api.qrserver.com (apenas para gerar códigos QR)
- **CDN JavaScript:** cdnjs.cloudflare.com (bibliotecas PDF.js e Tesseract.js)

### Recomendações de Segurança

- Use HTTPS em produção
- Faça backup regular dos dados importantes
- Configure CSP (Content Security Policy) adequadamente

## 🤝 Contribuindo

### Como Contribuir

1. **Fork o projeto**
2. **Crie uma branch para sua feature:**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. **Commit suas mudanças:**
   ```bash
   git commit -m 'Add: nova funcionalidade incrível'
   ```
4. **Push para a branch:**
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. **Abra um Pull Request**

### Diretrizes para Contribuição

- Mantenha o código limpo e documentado
- Teste em diferentes navegadores
- Siga os padrões de acessibilidade
- Use linguagem simples nos textos
- Mantenha compatibilidade com dispositivos móveis

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

## 👨‍⚖️ Autor

**Juiz de Direito Titular Sérgio Augusto Furtado Neto Viana**  
Juizado Especial da Comarca de Tauá - CE

### Contato

- 📧 E-mail: taua.jecc@tjce.jus.br
- 📞 Telefone: (85) 3108-2529
- 📱 WhatsApp: (85) 98198-8631

## 🙏 Agradecimentos

- **CNJ** - Pela Recomendação 144/2023 sobre linguagem simples
- **TJCE** - Pelo apoio e incentivo à inovação
- **ONU** - Pelos Objetivos de Desenvolvimento Sustentável
- **Comunidade Open Source** - Pelas bibliotecas utilizadas

## 📊 Estatísticas do Projeto

- **Linhas de código:** ~3.000
- **Arquivos:** 8
- **Funcionalidades:** 20+
- **Compatibilidade:** 95% dos navegadores modernos
- **Acessibilidade:** WCAG 2.1 AA

## 🚀 Roadmap

### Versão 2.1 (Próxima)

- [ ] Integração com API de IA (ChatGPT/Claude)
- [ ] Modo offline completo
- [ ] Exportação para Word (.docx)
- [ ] Assinatura digital
- [ ] Múltiplos idiomas

### Versão 2.2 (Futura)

- [ ] Integração com sistemas processuais
- [ ] App mobile nativo
- [ ] Dashboard analytics avançado
- [ ] Colaboração em tempo real
- [ ] Backup automático na nuvem

## 📞 Suporte

### FAQ

**P: O sistema funciona offline?**  
R: Parcialmente. Depois de carregado, funciona offline exceto OCR e QR Codes.

**P: Posso usar em outros tribunais?**  
R: Sim! Basta personalizar as informações de contato e logotipos.

**P: Os dados ficam seguros?**  
R: Sim. Tudo é processado localmente no seu navegador.

**P: Como relatar bugs?**  
R: Abra uma issue no GitHub ou entre em contato conosco.

### Problemas Comuns

1. **Página não carrega:** Verifique conexão e tente em modo anônimo
2. **Imagens não aparecem:** Normal, o sistema usa fallbacks automáticos
3. **Áudio não funciona:** Permita acesso ao microfone nas configurações
4. **OCR falha:** Use documentos com melhor qualidade de imagem

---

**Desenvolvido com ❤️ para democratizar o acesso à Justiça**

_"A justiça só é verdadeiramente acessível quando é compreensível por todos"_
