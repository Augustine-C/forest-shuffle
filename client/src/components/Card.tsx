interface CardProps {
    card: any;
    isSelected?: boolean;
    isCostSelected?: boolean;
    onClick?: () => void;
}

export default function Card({ card, isSelected, isCostSelected, onClick }: CardProps) {
    const classNames = [
        'card',
        isSelected ? 'selected' : '',
        isCostSelected ? 'cost-selected' : '',
        `type-${card.type}`
    ].join(' ');

    return (
        <div className={classNames} onClick={onClick}>
            <div className="card-header">
                <span className="name">{card.name}</span>
                <span className="cost">Cost: {card.cost}</span>
            </div>
            <div className="card-type">{card.type}</div>
            {card.type === 'split' && (
                <div className="split-info">
                    {card.top && <div>Top: {card.top.name}</div>}
                    {card.bottom && <div>Bottom: {card.bottom.name}</div>}
                    {card.left && <div>Left: {card.left.name}</div>}
                    {card.right && <div>Right: {card.right.name}</div>}
                </div>
            )}
        </div>
    );
}
