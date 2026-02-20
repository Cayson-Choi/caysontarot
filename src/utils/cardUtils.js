// Fisher-Yates shuffle
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawCards(deck, count, allowReversed = false) {
  const shuffled = shuffle(deck);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    reversed: allowReversed ? Math.random() < 0.5 : false,
  }));
}
