import type { SupportedLanguage } from '../types/index.ts';

// Cartas de acolhimento da tela Hoje. Sem orientação clínica, sem tom de aviso oficial,
// sem culpa e sem supor o gênero do bebê nem que quem usa é a mãe.
export type DailyCardCategory = 'validation' | 'selfcare' | 'humor' | 'perspective';

export interface DailyCard {
  id: string;
  category: DailyCardCategory;
  phase: 'pregnancy' | 'baby' | 'both';
  text: string;
}

export const DAILY_CARDS_PT: DailyCard[] = [
  // Acolhimento
  { id: 'val-gratitude', category: 'validation', phase: 'both', text: "Ninguém precisa sentir gratidão o tempo todo. Cansaço e amor cabem no mesmo dia." },
  { id: 'val-survive', category: 'validation', phase: 'both', text: "Se hoje foi só atravessar o dia, já foi muito. Ninguém dá nota para isso, mas se desse, seria dez." },
  { id: 'val-learning', category: 'validation', phase: 'baby', text: "Nem sempre dá para saber o que o bebê quer, e tudo bem. Vocês estão aprendendo juntos, um dia de cada vez." },
  { id: 'val-ask-help', category: 'validation', phase: 'both', text: "Pedir ajuda não é falhar. É um jeito inteligente de cuidar de quem você ama, inclusive de você." },
  { id: 'val-old-life', category: 'validation', phase: 'both', text: "Sentir falta da sua vida de antes não diminui em nada o seu amor. As duas coisas podem ser verdade." },
  { id: 'val-body-working', category: 'validation', phase: 'pregnancy', text: "Seu corpo está fazendo um trabalho enorme, mesmo nos momentos de repouso. Descansar também conta." },
  { id: 'val-hard-days', category: 'validation', phase: 'both', text: "Dias difíceis não dizem nada sobre o quanto você cuida bem. Só mostram que você merece descanso e apoio." },

  // Um minuto para você
  { id: 'self-breathe', category: 'selfcare', phase: 'both', text: "Feche os olhos, inspire pelo nariz e solte o ar devagar pela boca, três vezes. Só isso." },
  { id: 'self-water', category: 'selfcare', phase: 'both', text: "Que tal um copo de água agora, bebido com calma, só para você?" },
  { id: 'self-shoulders', category: 'selfcare', phase: 'both', text: "Solte os ombros, destrave o maxilar e relaxe a testa. Percebeu como estavam tensos?" },
  { id: 'self-phone-break', category: 'selfcare', phase: 'baby', text: "Na próxima soneca do bebê, tente ficar 5 minutos longe do celular. Só para a mente respirar." },
  { id: 'self-snack', category: 'selfcare', phase: 'both', text: "Coma alguma coisa de que você gosta hoje, nem que seja em pé na cozinha. Conta, sim." },
  { id: 'self-fresh-air', category: 'selfcare', phase: 'both', text: "Abra uma janela ou vá até a porta e respire um pouco de ar de fora por um minuto." },
  { id: 'self-cross-off', category: 'selfcare', phase: 'both', text: "Escolha uma tarefa da lista de hoje e risque sem fazer. Pronto, uma a menos." },
  { id: 'self-message', category: 'selfcare', phase: 'both', text: "Mande uma mensagem para alguém que te faz bem. Não precisa ser sobre nada." },

  // Rir para não chorar
  { id: 'hum-hair', category: 'humor', phase: 'both', text: "Lavar o cabelo hoje conta como ida ao spa. Ninguém precisa saber que durou cinco minutos." },
  { id: 'hum-warm-coffee', category: 'humor', phase: 'baby', text: "Café quente virou lenda depois que o bebê chegou. Morno também vale." },
  { id: 'hum-one-minute', category: 'humor', phase: 'both', text: "\"Só vou fechar os olhos um minutinho\" também é um plano completo." },
  { id: 'hum-alive', category: 'humor', phase: 'baby', text: "Se perguntarem o que você fez hoje, pode responder: \"cuidei de um bebê o dia inteiro\". É muita coisa." },
  { id: 'hum-comfy', category: 'humor', phase: 'both', text: "Roupa confortável é a alta-costura desta fase. Você está na moda." },
  { id: 'hum-one-hand', category: 'humor', phase: 'baby', text: "Conquista desbloqueada: fazer quase tudo com uma mão só." },
  { id: 'hum-shoes', category: 'humor', phase: 'pregnancy', text: "Reviravolta da gravidez: amarrar o tênis virou esporte de alto rendimento." },
  { id: 'hum-status', category: 'humor', phase: 'both', text: "Status do dia: funcionando à base de amor, café (ou chá) e a esperança de um cochilo." },
  { id: 'hum-bathroom', category: 'humor', phase: 'pregnancy', text: "Mais uma ida ao banheiro? Pode chamar de programa de caminhadas." },

  // Vai passar
  { id: 'per-nights', category: 'perspective', phase: 'baby', text: "As noites longas também passam. O tempo voa, mas de madrugada ele anda devagar." },
  { id: 'per-world-waits', category: 'perspective', phase: 'both', text: "Você não precisa dar conta de tudo. O mundo pode esperar um pouco." },
  { id: 'per-little-piece', category: 'perspective', phase: 'baby', text: "Um dia você vai sentir saudade de algum pedacinho de hoje. Não de tudo, mas de algum pedacinho." },
  { id: 'per-week-by-week', category: 'perspective', phase: 'pregnancy', text: "Cada semana é um passo a mais nesse caminho, no seu ritmo." },
  { id: 'per-tomorrow', category: 'perspective', phase: 'both', text: "Se hoje não saiu como você queria, tudo bem. Amanhã vocês recomeçam." },
  { id: 'per-understand', category: 'perspective', phase: 'baby', text: "Os primeiros meses são os mais intensos. A cada semana, vocês se entendem um pouco mais." }
];

export const DAILY_CARDS_EN: DailyCard[] = [
  // Validation
  { id: 'val-gratitude', category: 'validation', phase: 'both', text: "Nobody has to feel grateful all the time. Tiredness and love fit in the same day." },
  { id: 'val-survive', category: 'validation', phase: 'both', text: "If today was just about getting through, that's a lot. Nobody grades it, but if they did, you'd get full marks." },
  { id: 'val-learning', category: 'validation', phase: 'baby', text: "You won't always know what the baby wants, and that's okay. You're learning together, one day at a time." },
  { id: 'val-ask-help', category: 'validation', phase: 'both', text: "Asking for help isn't failing. It's a smart way to care for the people you love, including you." },
  { id: 'val-old-life', category: 'validation', phase: 'both', text: "Missing your old life doesn't make your love any smaller. Both things can be true." },
  { id: 'val-body-working', category: 'validation', phase: 'pregnancy', text: "Your body is doing huge work, even while you rest. Resting counts too." },
  { id: 'val-hard-days', category: 'validation', phase: 'both', text: "Hard days say nothing about how well you care. They only show that you deserve rest and support." },

  // A minute for you
  { id: 'self-breathe', category: 'selfcare', phase: 'both', text: "Close your eyes, breathe in through your nose and slowly out through your mouth, three times. That’s all." },
  { id: 'self-water', category: 'selfcare', phase: 'both', text: "How about a glass of water now, slowly, just for you?" },
  { id: 'self-shoulders', category: 'selfcare', phase: 'both', text: "Drop your shoulders, unclench your jaw and relax your forehead. Noticed how tense they were?" },
  { id: 'self-phone-break', category: 'selfcare', phase: 'baby', text: "During the baby's next nap, try 5 minutes away from your phone. Just to let your mind breathe." },
  { id: 'self-snack', category: 'selfcare', phase: 'both', text: "Eat something you enjoy today, even if it’s standing in the kitchen. It counts." },
  { id: 'self-fresh-air', category: 'selfcare', phase: 'both', text: "Open a window or step to the door and breathe some outside air for a minute." },
  { id: 'self-cross-off', category: 'selfcare', phase: 'both', text: "Pick one task from today's list and cross it off without doing it. There, one less." },
  { id: 'self-message', category: 'selfcare', phase: 'both', text: "Send a message to someone who makes you feel good. It doesn't have to be about anything." },

  // Laugh so you don't cry
  { id: 'hum-hair', category: 'humor', phase: 'both', text: "Washing your hair today counts as a spa day. Nobody needs to know it took five minutes." },
  { id: 'hum-warm-coffee', category: 'humor', phase: 'baby', text: "Hot coffee became a legend once the baby arrived. Lukewarm counts." },
  { id: 'hum-one-minute', category: 'humor', phase: 'both', text: "\"I'll just close my eyes for a minute\" is a complete plan too." },
  { id: 'hum-alive', category: 'humor', phase: 'baby', text: "If anyone asks what you did today, you can say: \"I looked after a baby all day.\" That's a lot." },
  { id: 'hum-comfy', category: 'humor', phase: 'both', text: "Comfy clothes are the haute couture of this season. You are on trend." },
  { id: 'hum-one-hand', category: 'humor', phase: 'baby', text: "Achievement unlocked: doing almost everything with one hand." },
  { id: 'hum-shoes', category: 'humor', phase: 'pregnancy', text: "Pregnancy plot twist: tying your shoes is now an elite sport." },
  { id: 'hum-status', category: 'humor', phase: 'both', text: "Today's status: running on love, coffee (or tea) and the hope of a nap." },
  { id: 'hum-bathroom', category: 'humor', phase: 'pregnancy', text: "Another trip to the bathroom? Call it your walking programme." },

  // This too shall pass
  { id: 'per-nights', category: 'perspective', phase: 'baby', text: "The long nights pass too. Time flies, but at 3 a.m. it walks slowly." },
  { id: 'per-world-waits', category: 'perspective', phase: 'both', text: "You don't have to handle everything. The world can wait a little." },
  { id: 'per-little-piece', category: 'perspective', phase: 'baby', text: "One day you'll miss some little piece of today. Not all of it, but some little piece." },
  { id: 'per-week-by-week', category: 'perspective', phase: 'pregnancy', text: "Each week is one more step along the way, at your own pace." },
  { id: 'per-tomorrow', category: 'perspective', phase: 'both', text: "If today didn't go the way you wanted, that's okay. Tomorrow is a fresh start." },
  { id: 'per-understand', category: 'perspective', phase: 'baby', text: "The first months are the most intense. Each week, you understand each other a little more." }
];

export const getDailyCards = (lang: SupportedLanguage = 'pt-BR'): DailyCard[] => {
  return lang === 'en' ? DAILY_CARDS_EN : DAILY_CARDS_PT;
};
