import type { GameIconName } from './gameIconData';

interface GameIconProps {
  name: GameIconName;
  label?: string;
  className?: string;
}

export default function GameIcon({ name, label, className = '' }: GameIconProps) {
  return (
    <img
      className={`game-icon ${className}`.trim()}
      src={`${import.meta.env.BASE_URL}game-icons/${name}.png`}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
    />
  );
}
