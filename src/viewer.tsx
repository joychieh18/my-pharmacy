import { createRoot } from 'react-dom/client';
import { Pharmacy } from './pharmacy';
import type { Game } from './model';
import './style.css';

const root = createRoot(document.getElementById('root')!);
const game: Game = JSON.parse(
  document.getElementById('pharmacy-data')!.textContent!,
);
root.render(
  <main>
    <Pharmacy game={game} />
  </main>,
);
