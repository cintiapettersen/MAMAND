import { SupportedLanguage } from '../types';

// Cartas de acolhimento da Home. Sem promessas clínicas e sem supor o gênero do bebê.
export type DailyCardCategory = 'validation' | 'selfcare' | 'humor' | 'perspective';

export interface DailyCard {
  id: string;
  category: DailyCardCategory;
  phase: 'pregnancy' | 'baby' | 'both';
  text: string;
}

export const DAILY_CARDS_PT: DailyCard[] = [
  // Acolhimento
  { id: 'val-gratitude', category: 'validation', phase: 'both', text: 'Você não precisa se sentir grata o tempo todo para ser uma boa mãe. Cansaço e amor cabem no mesmo dia.' },
  { id: 'val-survive', category: 'validation', phase: 'both', text: 'Se hoje foi só atravessar o dia, já foi muito. Ninguém dá nota para isso, mas se desse, seria dez.' },
  { id: 'val-learning', category: 'validation', phase: 'baby', text: 'Nem sempre dá para saber o que o bebê quer, e tudo bem. Vocês estão aprendendo juntos, um dia de cada vez.' },
  { id: 'val-ask-help', category: 'validation', phase: 'both', text: 'Pedir ajuda não é falhar. É um jeito inteligente de cuidar de quem você ama, inclusive de você.' },
  { id: 'val-old-life', category: 'validation', phase: 'both', text: 'Sentir falta da sua vida de antes não diminui em nada o seu amor. As duas coisas podem ser verdade.' },
  { id: 'val-body-working', category: 'validation', phase: 'pregnancy', text: 'Seu corpo está fazendo um trabalho enorme, mesmo quando você está parada. Descansar também é produzir.' },
  { id: 'val-trust', category: 'validation', phase: 'baby', text: 'Você conhece o seu bebê melhor do que qualquer conselho de internet. Confie no que você observa.' },
  { id: 'val-hard-days', category: 'validation', phase: 'both', text: 'Dias difíceis não fazem de você uma mãe pior. Fazem de você uma pessoa cansada, que merece descanso e apoio.' },

  // Um minuto para você
  { id: 'self-breathe', category: 'selfcare', phase: 'both', text: 'Feche os olhos, inspire pelo nariz e solte o ar devagar pela boca, três vezes. Só isso.' },
  { id: 'self-water', category: 'selfcare', phase: 'both', text: 'Pegue um copo de água agora e beba com calma. Seu corpo está trabalhando muito.' },
  { id: 'self-shoulders', category: 'selfcare', phase: 'both', text: 'Solte os ombros, destrave o maxilar e relaxe a testa. Percebeu como estavam tensos?' },
  { id: 'self-phone-break', category: 'selfcare', phase: 'baby', text: 'Na próxima soneca do bebê, tente ficar 5 minutos longe do celular. Só para a mente respirar.' },
  { id: 'self-snack', category: 'selfcare', phase: 'both', text: 'Coma alguma coisa de que você gosta hoje, nem que seja em pé na cozinha. Conta, sim.' },
  { id: 'self-fresh-air', category: 'selfcare', phase: 'both', text: 'Abra uma janela ou vá até a porta e respire um pouco de ar de fora por um minuto.' },
  { id: 'self-cross-off', category: 'selfcare', phase: 'both', text: 'Escolha uma tarefa da lista de hoje e risque sem fazer. Pronto, uma a menos.' },
  { id: 'self-side-rest', category: 'selfcare', phase: 'pregnancy', text: 'Se puder, deite de lado com um travesseiro entre os joelhos por alguns minutos. Seu corpo agradece.' },
  { id: 'self-message', category: 'selfcare', phase: 'both', text: 'Mande uma mensagem para alguém que te faz bem. Não precisa ser sobre nada.' },

  // Rir para não chorar
  { id: 'hum-spa', category: 'humor', phase: 'both', text: 'O Ministério da Maternidade adverte: lavar o cabelo hoje conta oficialmente como ida ao spa.' },
  { id: 'hum-warm-coffee', category: 'humor', phase: 'baby', text: 'Curiosidade científica: café quente é uma lenda urbana depois que o bebê chega. Morno também vale.' },
  { id: 'hum-one-minute', category: 'humor', phase: 'both', text: 'Lembrete oficial: "só vou fechar os olhos um minutinho" é um plano completo e válido.' },
  { id: 'hum-alive', category: 'humor', phase: 'baby', text: 'Se perguntarem o que você fez hoje, a resposta certa é: "mantive um ser humano vivo". Fim.' },
  { id: 'hum-comfy', category: 'humor', phase: 'both', text: 'Roupa confortável é a alta-costura desta fase. Você está na moda.' },
  { id: 'hum-one-hand', category: 'humor', phase: 'baby', text: 'Conquista desbloqueada: fazer quase tudo com uma mão só.' },
  { id: 'hum-shoes', category: 'humor', phase: 'pregnancy', text: 'Plot twist da gravidez: amarrar o tênis virou esporte de alto rendimento.' },
  { id: 'hum-status', category: 'humor', phase: 'both', text: 'Status do dia: funcionando à base de amor, café (ou chá) e a esperança de um cochilo.' },
  { id: 'hum-bathroom', category: 'humor', phase: 'pregnancy', text: 'Mais uma ida ao banheiro? Pode chamar de programa de caminhadas.' },

  // Vai passar
  { id: 'per-nights', category: 'perspective', phase: 'baby', text: 'Essa fase vai passar. As noites longas também. O tempo voa, mas de madrugada ele anda devagar. Segure firme.' },
  { id: 'per-world-waits', category: 'perspective', phase: 'both', text: 'Você não precisa dar conta de tudo. O mundo pode esperar um pouco.' },
  { id: 'per-little-piece', category: 'perspective', phase: 'baby', text: 'Um dia você vai sentir saudade de algum pedacinho de hoje. Não de tudo, mas de algum pedacinho.' },
  { id: 'per-not-perfect', category: 'perspective', phase: 'both', text: 'Hoje não precisa ser perfeito. Só precisa acabar. Amanhã é outro dia.' },
  { id: 'per-week-by-week', category: 'perspective', phase: 'pregnancy', text: 'Cada semana é um passo a mais nesse caminho. Um dia de cada vez já é o bastante.' },
  { id: 'per-smaller', category: 'perspective', phase: 'both', text: 'O que parece enorme agora vai ficar menor com o tempo. Você não precisa resolver tudo hoje.' },
  { id: 'per-understand', category: 'perspective', phase: 'baby', text: 'Os primeiros meses são os mais intensos. A cada semana, vocês se entendem um pouco mais.' }
];

export const DAILY_CARDS_EN: DailyCard[] = [
  // Validation
  { id: 'val-gratitude', category: 'validation', phase: 'both', text: "You don't have to feel grateful all the time to be a good mom. Tiredness and love fit in the same day." },
  { id: 'val-survive', category: 'validation', phase: 'both', text: "If today was just about getting through, that's a lot. Nobody grades it, but if they did, you'd get full marks." },
  { id: 'val-learning', category: 'validation', phase: 'baby', text: "You won't always know what the baby wants, and that's okay. You're learning together, one day at a time." },
  { id: 'val-ask-help', category: 'validation', phase: 'both', text: "Asking for help isn't failing. It's a smart way to care for the people you love, including you." },
  { id: 'val-old-life', category: 'validation', phase: 'both', text: "Missing your old life doesn't make your love any smaller. Both things can be true." },
  { id: 'val-body-working', category: 'validation', phase: 'pregnancy', text: 'Your body is doing huge work, even when you are sitting still. Resting is productive too.' },
  { id: 'val-trust', category: 'validation', phase: 'baby', text: 'You know your baby better than any advice online. Trust what you notice.' },
  { id: 'val-hard-days', category: 'validation', phase: 'both', text: "Hard days don't make you a worse mom. They make you a tired person who deserves rest and support." },

  // A minute for you
  { id: 'self-breathe', category: 'selfcare', phase: 'both', text: 'Close your eyes, breathe in through your nose and slowly out through your mouth, three times. That’s all.' },
  { id: 'self-water', category: 'selfcare', phase: 'both', text: 'Grab a glass of water now and drink it slowly. Your body is working hard.' },
  { id: 'self-shoulders', category: 'selfcare', phase: 'both', text: 'Drop your shoulders, unclench your jaw and relax your forehead. Noticed how tense they were?' },
  { id: 'self-phone-break', category: 'selfcare', phase: 'baby', text: "During the baby's next nap, try 5 minutes away from your phone. Just to let your mind breathe." },
  { id: 'self-snack', category: 'selfcare', phase: 'both', text: 'Eat something you enjoy today, even if it’s standing in the kitchen. It counts.' },
  { id: 'self-fresh-air', category: 'selfcare', phase: 'both', text: 'Open a window or step to the door and breathe some outside air for a minute.' },
  { id: 'self-cross-off', category: 'selfcare', phase: 'both', text: "Pick one task from today's list and cross it off without doing it. There, one less." },
  { id: 'self-side-rest', category: 'selfcare', phase: 'pregnancy', text: 'If you can, lie on your side with a pillow between your knees for a few minutes. Your body will thank you.' },
  { id: 'self-message', category: 'selfcare', phase: 'both', text: "Send a message to someone who makes you feel good. It doesn't have to be about anything." },

  // Laugh so you don't cry
  { id: 'hum-spa', category: 'humor', phase: 'both', text: 'Official notice from the Ministry of Motherhood: washing your hair today officially counts as a spa day.' },
  { id: 'hum-warm-coffee', category: 'humor', phase: 'baby', text: 'Scientific fact: hot coffee is an urban legend once the baby arrives. Lukewarm counts.' },
  { id: 'hum-one-minute', category: 'humor', phase: 'both', text: 'Official reminder: "I’ll just close my eyes for a minute" is a complete and valid plan.' },
  { id: 'hum-alive', category: 'humor', phase: 'baby', text: 'If anyone asks what you did today, the correct answer is: "kept a human being alive." The end.' },
  { id: 'hum-comfy', category: 'humor', phase: 'both', text: 'Comfy clothes are the haute couture of this season. You are on trend.' },
  { id: 'hum-one-hand', category: 'humor', phase: 'baby', text: 'Achievement unlocked: doing almost everything with one hand.' },
  { id: 'hum-shoes', category: 'humor', phase: 'pregnancy', text: 'Pregnancy plot twist: tying your shoes is now an elite sport.' },
  { id: 'hum-status', category: 'humor', phase: 'both', text: "Today's status: running on love, coffee (or tea) and the hope of a nap." },
  { id: 'hum-bathroom', category: 'humor', phase: 'pregnancy', text: 'Another trip to the bathroom? Call it your walking programme.' },

  // This too shall pass
  { id: 'per-nights', category: 'perspective', phase: 'baby', text: 'This phase will pass. The long nights too. Time flies, but at 3 a.m. it walks slowly. Hold on.' },
  { id: 'per-world-waits', category: 'perspective', phase: 'both', text: "You don't have to handle everything. The world can wait a little." },
  { id: 'per-little-piece', category: 'perspective', phase: 'baby', text: "One day you'll miss some little piece of today. Not all of it, but some little piece." },
  { id: 'per-not-perfect', category: 'perspective', phase: 'both', text: "Today doesn't have to be perfect. It just has to end. Tomorrow is another day." },
  { id: 'per-week-by-week', category: 'perspective', phase: 'pregnancy', text: 'Each week is one more step along the way. One day at a time is enough.' },
  { id: 'per-smaller', category: 'perspective', phase: 'both', text: "What feels huge now will get smaller with time. You don't have to solve everything today." },
  { id: 'per-understand', category: 'perspective', phase: 'baby', text: 'The first months are the most intense. Each week, you understand each other a little more.' }
];

export const getDailyCards = (lang: SupportedLanguage = 'pt-BR'): DailyCard[] => {
  return lang === 'en' ? DAILY_CARDS_EN : DAILY_CARDS_PT;
};
