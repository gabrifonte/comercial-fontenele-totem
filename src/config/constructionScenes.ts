/**
 * Cenas de obra do mascote no modo descanso.
 * Cada serviço (job) tem 8 desfechos diferentes (engraçados ou não): 14 serviços x 8 = 112 cenas.
 */

export type Effect =
  | 'water' | 'sparks' | 'dust' | 'paint' | 'smoke'
  | 'stars' | 'boom' | 'confetti' | 'gift' | 'bubbles';

export type Reaction =
  | 'jump' | 'shake' | 'spin' | 'fall' | 'dizzy'
  | 'flee' | 'dance' | 'proud' | 'faint' | 'flip';

export interface SceneOutcome {
  effect: Effect;
  react: Reaction;
  say: string;
}

export interface SceneJob {
  id: string;
  title: string;
  target: string; // emoji do que está sendo consertado
  tool: string; // emoji da ferramenta
  intro: string;
  outcomes: SceneOutcome[];
}

const o = (effect: Effect, react: Reaction, say: string): SceneOutcome => ({ effect, react, say });

export const JOBS: SceneJob[] = [
  {
    id: 'furar',
    title: 'Furando a parede',
    target: '🧱',
    tool: '🪛',
    intro: 'Vou furar essa parede rapidinho! 🪛',
    outcomes: [
      o('water', 'jump', 'Opa! Acertei o cano! 💦 Chama o encanador!'),
      o('sparks', 'dizzy', 'Eita! Era o fio! Fiquei todo arrepiado! ⚡'),
      o('dust', 'shake', 'Furei demais... agora virou janela! 🪟'),
      o('boom', 'flee', 'Ih... a parede rachou até o teto! 😱'),
      o('gift', 'jump', 'Achei um presente escondido na parede! 🎁'),
      o('stars', 'flip', 'O vizinho apareceu pelo buraco: "Bom dia!" 😳'),
      o('stars', 'dizzy', 'A furadeira tem vida própria! 🌀'),
      o('confetti', 'proud', 'Furo perfeito! Sou ou não sou profissional? 😎'),
    ],
  },
  {
    id: 'pintar',
    title: 'Pintando a parede',
    target: '🏠',
    tool: '🖌️',
    intro: 'Hora de dar uma cara nova pra essa parede! 🎨',
    outcomes: [
      o('paint', 'shake', 'Derrubei a lata de tinta em mim mesmo! 🎨'),
      o('paint', 'dance', 'Virei obra de arte moderna! 🖼️'),
      o('confetti', 'proud', 'Ficou um espetáculo! Sem uma gota fora! 👏'),
      o('bubbles', 'jump', 'Pintei até a mosca que pousou! 🪰'),
      o('paint', 'fall', 'Escorreguei na tinta fresca! 🛝'),
      o('stars', 'dizzy', 'O cheiro de tinta me deixou tonto! 😵'),
      o('paint', 'flip', 'Cor errada! Era azul, saiu rosa! 💗'),
      o('dust', 'spin', 'Esqueci de lixar antes... agora descascou tudo! 😅'),
    ],
  },
  {
    id: 'cano',
    title: 'Consertando o cano',
    target: '🚰',
    tool: '🔧',
    intro: 'Esse cano vazando vai ver só! 🔧',
    outcomes: [
      o('water', 'jump', 'Apertei demais e o cano estourou! 💦'),
      o('water', 'faint', 'Virei chafariz humano! 🌊'),
      o('confetti', 'proud', 'Vazamento resolvido! Nem uma gota! 💧❌'),
      o('bubbles', 'dance', 'Saiu espuma ao invés de água! 🫧'),
      o('water', 'flee', 'Socorro, a casa tá virando piscina! 🏊'),
      o('stars', 'dizzy', 'A chave inglesa girou e me girou junto! 🌀'),
      o('sparks', 'jump', 'Cano e fio brigaram... eu perdi! ⚡'),
      o('gift', 'flip', 'Tinha uma moedinha entupindo o cano! 🪙'),
    ],
  },
  {
    id: 'tomada',
    title: 'Instalando a tomada',
    target: '🔌',
    tool: '🪛',
    intro: 'Vou instalar essa tomada com muito cuidado! 🔌',
    outcomes: [
      o('sparks', 'dizzy', 'Zzzzap! Meu cabelo ficou em pé! ⚡'),
      o('smoke', 'shake', 'Saiu fumaça! Foi só o susto... acho! 💨'),
      o('confetti', 'proud', 'Tomada instalada! Que luz bonita! 💡'),
      o('sparks', 'faint', 'Esqueci de desligar o disjuntor... 😵'),
      o('stars', 'dance', 'Liguei o rádio e deu festa na obra! 🎶'),
      o('boom', 'flee', 'Faísca gigante! Todo mundo corre! 🏃'),
      o('gift', 'jump', 'Ligou e saiu um brinde! Promoção do dia! 🎁'),
      o('stars', 'flip', 'Liguei o ventilador no máximo! 🌪️'),
    ],
  },
  {
    id: 'tijolos',
    title: 'Assentando tijolos',
    target: '🧱',
    tool: '🔨',
    intro: 'Tijolo por tijolo, a obra vai crescer! 🧱',
    outcomes: [
      o('boom', 'fall', 'Parede torta! Parece a Torre de Pisa! 🗼'),
      o('dust', 'shake', 'A pilha de tijolos desabou! 🧱💥'),
      o('confetti', 'proud', 'Parede retinha! Nível perfeito! 📏'),
      o('dust', 'spin', 'Fiz a parede... e fechei a porta! 🚪'),
      o('stars', 'jump', 'Achei um tijolo de ouro! ✨ (é pintura...)'),
      o('bubbles', 'dance', 'Cimento demais! Virei estátua! 🗿'),
      o('boom', 'flee', 'Um tijolo caiu no meu pé! Ai ai ai! 🦶'),
      o('gift', 'jump', 'Parede pronta e ainda sobrou brinde! 🎁'),
    ],
  },
  {
    id: 'serrar',
    title: 'Serrando madeira',
    target: '🪵',
    tool: '🪚',
    intro: 'Vou serrar essa tábua no tamanho certo! 🪚',
    outcomes: [
      o('dust', 'shake', 'Serrei... a mesa também! 🪑'),
      o('dust', 'jump', 'Serragem pra todo lado! Atchim! 🤧'),
      o('confetti', 'proud', 'Corte reto como régua! 📐'),
      o('stars', 'flip', 'Cortei curto demais. Mediu duas vezes? Não! 😬'),
      o('smoke', 'dizzy', 'A serra esquentou e saiu fumaça! 🔥'),
      o('boom', 'faint', 'A madeira partiu no meio! Crac! 💥'),
      o('gift', 'dance', 'Dentro da tábua tinha uma surpresa! 🎁'),
      o('dust', 'spin', 'Serrei tão rápido que virei furacão! 🌪️'),
    ],
  },
  {
    id: 'prego',
    title: 'Martelando o prego',
    target: '🪧',
    tool: '🔨',
    intro: 'Um pregozinho aqui, outro ali! 🔨',
    outcomes: [
      o('stars', 'jump', 'Marteladaaa no dedo! AAAI! 🤕'),
      o('boom', 'shake', 'O prego entortou! De novo! 😤'),
      o('confetti', 'proud', 'Prego reto, quadro no lugar! 🖼️'),
      o('dust', 'fall', 'Quebrei a parede com o martelo! 😅'),
      o('sparks', 'dizzy', 'Bati num fio! Zzzap! ⚡'),
      o('water', 'flee', 'Acertei o cano de novo! 💦'),
      o('stars', 'flip', 'O martelo voou e deu a volta! 🪃'),
      o('gift', 'dance', 'Pendurei o quadro e apareceu um cofre! 💰'),
    ],
  },
  {
    id: 'lampada',
    title: 'Trocando a lâmpada',
    target: '💡',
    tool: '🪜',
    intro: 'Quantos construtores pra trocar uma lâmpada? Só eu! 💡',
    outcomes: [
      o('boom', 'fall', 'A escada balançou! Ahhhh! 🪜'),
      o('sparks', 'dizzy', 'Esqueci de desligar! Zzzap! ⚡'),
      o('confetti', 'proud', 'Fez-se a luz! Eu sou um gênio! 💡'),
      o('stars', 'dance', 'A lâmpada ligou e virou balada! 🪩'),
      o('smoke', 'shake', 'Queimou na minha mão! Ui, quente! 🔥'),
      o('boom', 'flee', 'Estourou! Cuidado com os cacos! 💥'),
      o('gift', 'jump', 'Caiu um brinde de dentro do lustre! 🎁'),
      o('stars', 'spin', 'Rosqueei tanto que girei junto! 🌀'),
    ],
  },
  {
    id: 'cimento',
    title: 'Misturando cimento',
    target: '🪣',
    tool: '🥄',
    intro: 'Cimento, areia e água... a receita da obra! 🪣',
    outcomes: [
      o('dust', 'shake', 'Nuvem de cimento! Virei fantasma! 👻'),
      o('water', 'jump', 'Água demais! Virou sopa! 🥣'),
      o('confetti', 'proud', 'Massa no ponto certinho! Chef de obra! 👨‍🍳'),
      o('bubbles', 'dance', 'A massa fez bolhas! Parece shampoo! 🫧'),
      o('dust', 'faint', 'Caí no saco de cimento! Atchim! 🤧'),
      o('boom', 'flip', 'A betoneira girou e eu junto! 🌀'),
      o('stars', 'dizzy', 'Misturei tanto que tonteei! 😵‍💫'),
      o('gift', 'jump', 'Achei uma moeda de ouro na areia! 🪙'),
    ],
  },
  {
    id: 'trena',
    title: 'Medindo com a trena',
    target: '📏',
    tool: '📐',
    intro: 'Meça duas vezes, corte uma! 📏',
    outcomes: [
      o('stars', 'fall', 'A trena recolheu e me puxou! 😂'),
      o('boom', 'jump', 'Errei a conta: 3 metros viraram 3 centímetros! 🤯'),
      o('confetti', 'proud', 'Medida exata ao milímetro! 🎯'),
      o('stars', 'flip', 'A trena virou chicote! Cuidado! ⚡'),
      o('dust', 'spin', 'Medi a sala e a casa do vizinho também! 🏘️'),
      o('stars', 'dizzy', 'Enrolei na trena como uma múmia! 🧻'),
      o('gift', 'dance', 'Medindo, achei um brinde atrás do armário! 🎁'),
      o('bubbles', 'shake', 'Medi tudo tortinho! O nível riu de mim! 🫧'),
    ],
  },
  {
    id: 'lixar',
    title: 'Lixando a porta',
    target: '🚪',
    tool: '🧽',
    intro: 'Essa porta vai ficar lisinha como bebê! 🚪',
    outcomes: [
      o('dust', 'shake', 'Poeira pra todo lado! Parece neblina! 🌫️'),
      o('dust', 'faint', 'Lixei tanto que a porta sumiu! 😮'),
      o('confetti', 'proud', 'Lisinha! Até espelha! ✨'),
      o('stars', 'dance', 'Lixei no ritmo da música! 🎵'),
      o('dust', 'jump', 'Entrou poeira no nariz! Atchiiim! 🤧'),
      o('boom', 'fall', 'A lixadeira escapou e saiu dançando! 💃'),
      o('gift', 'flip', 'Atrás da porta tinha um brinde! 🎁'),
      o('smoke', 'dizzy', 'Lixei com tanta força que esquentou! 🔥'),
    ],
  },
  {
    id: 'prateleira',
    title: 'Parafusando a prateleira',
    target: '📚',
    tool: '🪛',
    intro: 'Prateleira firme pra guardar tudo! 📚',
    outcomes: [
      o('boom', 'fall', 'Prateleira torta! Os livros escorregaram! 📚💥'),
      o('dust', 'shake', 'Furei a parede errada e entrei na cozinha! 🍳'),
      o('confetti', 'proud', 'Prateleira firme como rocha! 🪨'),
      o('stars', 'flip', 'Parafusei ao contrário... virou cabide! 👔'),
      o('boom', 'jump', 'Os parafusos sumiram! Quem pegou? 🔩'),
      o('stars', 'dizzy', 'Girei a chave e a casa girou junto! 🌀'),
      o('gift', 'dance', 'Em cima da prateleira, apareceu um brinde! 🎁'),
      o('sparks', 'dizzy', 'Parafusei um fio! Zzzap! ⚡'),
    ],
  },
  {
    id: 'piso',
    title: 'Assentando o piso',
    target: '🔲',
    tool: '🔨',
    intro: 'Piso novo, casa nova! 🔲',
    outcomes: [
      o('dust', 'fall', 'Escorreguei no piso molhado! Uiii! 🛝'),
      o('boom', 'shake', 'Quebrei um azulejo! Foi só um... mentira, foram vinte! 😅'),
      o('confetti', 'proud', 'Piso alinhado! Dá pra jogar sinuca! 🎱'),
      o('water', 'jump', 'Pisei na massa mole! Meu sapato ficou! 👞'),
      o('stars', 'dance', 'Piso xadrez! Vamos jogar? ♟️'),
      o('stars', 'spin', 'Assentei de trás pra frente e rodei! 🌀'),
      o('gift', 'jump', 'Embaixo do piso tinha um tesouro! 💰'),
      o('dust', 'dizzy', 'Fiquei olhando o piso e fiquei tonto! 🌀'),
    ],
  },
  {
    id: 'torneira',
    title: 'Instalando a torneira',
    target: '🚿',
    tool: '🔧',
    intro: 'Torneira nova pra pia nova! 🚿',
    outcomes: [
      o('water', 'faint', 'Abri com força e levei banho! 🚿'),
      o('water', 'flee', 'A torneira virou esguicho de piscina! 🌊'),
      o('confetti', 'proud', 'Torneira perfeita! Nem pingou! 💧'),
      o('bubbles', 'dance', 'Saiu só espuma! Que luxo! 🫧'),
      o('water', 'jump', 'Água quente! Água fria! Água quente! Ui! 🥵🥶'),
      o('stars', 'dizzy', 'Apertei, apertei... e rodei a pia! 🌀'),
      o('water', 'spin', 'Fiz uma cachoeira na cozinha! 🏞️'),
      o('gift', 'flip', 'Quando abri, caiu um brinde da torneira! 🎁'),
    ],
  },
];

export const SCENES = JOBS.flatMap((job) => job.outcomes.map((outcome) => ({ job, outcome })));
export type Scene = (typeof SCENES)[number];
