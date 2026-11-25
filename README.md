# 🎡 Totem Interativo — Roleta de Prêmios, Mascote 3D com IA & Gestão de Estoque em Tempo Real

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-Interactions_API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Electron](https://img.shields.io/badge/Electron-Desktop_Kiosk-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)

Sistema completo de **Totem Interativo de Ponto de Venda (PDV)** desenvolvido para a **Comercial Fontenele**, integrando gamificação para clientes no balcão, **Mascote 3D autônomo com Inteligência Artificial** no modo descanso (*Attract Mode*), captura de selfie com moldura personalizada e controle de estoque em nuvem com transações atômicas em tempo real.

---

## 🌐 Demonstração Interativa para Portfólio (Modo Visitante Seguro)

👉 **[Testar Versão Demo de Portfólio (Dados Fictícios)](https://comercial-fontenele-totem.web.app/?demo=1)**

> 🔒 **Aviso de Segurança e Privacidade (Modo Portfólio):**
> Ao acessar pelo link de demonstração (`?demo=1`) ou clonar este repositório sem as chaves privadas da loja, o sistema executa automaticamente em **Modo Visitante (Sandbox)**:
> - **Liberado para Teste:** Giro da Roleta a 60 FPS com 7 brindes fictícios de demonstração, **Modo Descanso com Mascote 3D interativo** (pintura, hidráulica, caixa de ferramentas e reações inteligentes por prêmio) e câmera de Selfie do Ganhador.
> - **100% Bloqueado:** O Painel Gerencial, o histórico real de sorteios, o estoque oficial no Firebase Firestore e as credenciais administrativas da loja permanecem **totalmente isolados e inacessíveis** para visitantes externos.

---

## ✨ Principais Funcionalidades e Engenharia

### 1. 🎡 Roleta Física em Canvas HTML5 a 60 FPS (`WheelCanvas` & `DemoWheel`)
- Renderização vetorial em `<canvas>` de alta resolução com desaceleração física (`quintic ease-out`), pinos metálicos, iluminação radial e áudio procedural sintetizado via **Web Audio API** (rufo de bateria progressivo e fanfarra de vitória sem dependência de arquivos MP3 externos).
- Tipografia adaptativa que calcula automaticamente quebras de linha e orientação angular para que nenhum texto fique de cabeça para baixo ou truncado.

### 2. 🤖 Mascote 3D Autônomo com Malha Articulada 60 FPS e Gemini AI (`WheelMascot` & `mascotBrain`)
- **Skeletal Strip-Mesh Canvas (60 FPS):** Divide a textura 3D de alta definição do mascote ("Seu Fontenele") em 40 faixas horizontais articuladas, mantendo as botas ancoradas no piso enquanto aplica respiração tridimensional orgânica no tórax, ombros e cabeça, além de transições suaves com antecipação física.
- **Motor Cognitivo (+120.000 Interações Combinatórias + Gemini Interactions API):** O mascote possui rotina própria no canto superior direito da tela de descanso — inspeciona suas maletas de ferramentas, pinta a parede com rolo 3D, calibra tubulação hidráulica de cobre/latão, tem pensamentos próprios (`💭`) e reage **especificamente ao prêmio exato** em que a seta da roleta parou.
- **Suporte Nativo a Vídeo 3D (`veo3Engine`):** Integração com a **Interactions API** (`@google/genai`) e cache em **IndexedDB**.

### 3. 📸 Câmera de Selfie do Ganhador & Portão QR Code (`SelfiePage` & `QrGate`)
- Alternância entre câmera frontal (selfie com espelhamento natural e correção de distância focal/zoom) e câmera traseira, gerando card comemorativo com a marca oficial pronto para compartilhamento no Instagram (`@_comercial_fontenele`).

### 4. ☁️ Sincronização em Tempo Real e Transações Atômicas (`cloud.ts`)
- Arquitetura *Offline-First* com **Firebase Firestore** (`persistentLocalCache` + `runTransaction`): cada brinde sorteado deduz o estoque atomicamente entre múltiplos computadores/totens e bloqueia automaticamente a fatia quando o saldo atinge zero.
- Autenticação administrativa via **Firebase Authentication** com expiração automática de sessão por inatividade e regras de segurança granulares em [`firestore.rules`](./firestore.rules).

---

## 🛠️ Stack Tecnológica

- **Front-end:** React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide Icons
- **Gráficos & Áudio:** HTML5 Canvas 2D (Skeletal Mesh & Wheel Physics), Web Audio API Synthesizer
- **IA & Multimodal:** Google GenAI SDK (`@google/genai` — Interactions API `gemini-3.8-flash` & `gemini-omni-1.2-flash`)
- **Cloud & Banco de Dados:** Firebase Authentication, Cloud Firestore, Firebase Hosting, IndexedDB (armazenamento local de vídeos promocionais)
- **Desktop Packaging:** Electron + Electron Builder (empacotamento nativo macOS/Windows para operação em totem touchscreen)

---

## 🚀 Como Executar Localmente (Modo Demonstração)

```bash
# 1. Clone o repositório
git clone https://github.com/gabrifonte/comercial-fontenele-totem.git
cd comercial-fontenele-totem

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento (inicia automaticamente no Modo Demo com dados fictícios)
npm run dev
```

---

## 👨‍💻 Autor

Desenvolvido por **Gabriel Fontenele**  
🔗 [GitHub (@gabrifonte)](https://github.com/gabrifonte)
