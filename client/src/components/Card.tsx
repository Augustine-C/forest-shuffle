import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { EnhancedCard, SpeciesData } from '../../../shared/types';
import { getCardArtwork } from './cardArtwork';

interface CardProps {
    card: EnhancedCard;
    isSelected?: boolean;
    isCostSelected?: boolean;
    selectedSpeciesIndex?: number;
    onClick?: () => void;
    slot?: 'top' | 'bottom' | 'left' | 'right';
}

interface TooltipProps {
    species: { name: string; speciesData: SpeciesData; treeSymbol?: string };
    cardId: number;
    deck: string;
    anchorRect: DOMRect | null;
}

function TooltipPortal({ species, cardId, deck, anchorRect }: TooltipProps) {
    if (!anchorRect) return null;

    // Calculate position: centered above the element
    const top = anchorRect.top - 10; // 10px spacing
    const left = anchorRect.left + (anchorRect.width / 2);

    const style: React.CSSProperties = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translate(-50%, -100%)', // Centered and above
        zIndex: 9999, // On top of everything
        pointerEvents: 'none',
    };

    return createPortal(
        <div className="details-tooltip" style={style}>
            <div className="tooltip-header">
                {species.name} <span className="tooltip-id">#{cardId}</span>
            </div>
            <div className="tooltip-meta">
                <span className="tooltip-cost">Cost: {species.speciesData.cost}</span>
                <span className="tooltip-deck">Deck: {deck}</span>
            </div>
            <div className="tooltip-tags">
                {species.speciesData.tags.map(tag => (
                    <span key={tag} className={`tag tag-${tag.toLowerCase().replace(/\|(?!\s)/g, '-').replace(/\s+/g, '-')}`}>
                        {tag}
                    </span>
                ))}
            </div>
            {species.treeSymbol && (
                <div className="tooltip-symbol">Symbol: 🌳 {species.treeSymbol}</div>
            )}
            {species.speciesData.effect && (
                <div className="tooltip-effect">
                    <strong>Effect:</strong> {species.speciesData.effect}
                </div>
            )}
            {species.speciesData.bonus && (
                <div className="tooltip-bonus">
                    <strong>Bonus:</strong> {species.speciesData.bonus}
                </div>
            )}
            {species.speciesData.points && (
                <div className="tooltip-points">
                    <strong>Points:</strong> {species.speciesData.points}
                </div>
            )}
        </div>,
        document.body
    );
}

export default function Card({ card, isSelected, isCostSelected, selectedSpeciesIndex, onClick, slot }: CardProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (index: number, e: React.MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        setAnchorRect(target.getBoundingClientRect());
        setHoveredIndex(index);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setAnchorRect(null);
    };

    // Update rect on scroll or resize if needed, but simple hover is usually enough.
    // Ideally we listen to scroll to close it, but let's keep it simple.

    const artworkStyle = getCardArtwork(card);
    const classNames = [
        'card',
        artworkStyle ? 'has-card-art' : '',
        isSelected ? 'selected' : '',
        isCostSelected ? 'cost-selected' : '',
        `orientation-${card.orientation}`,
        card.isWinterCard ? 'winter-card' : '',
        slot ? `in-slot slot-${slot}` : ''
    ].join(' ');

    // Determine which species to show if in a slot
    let visibleSpecies = card.species;
    let forceSelectedIdx: number | undefined = selectedSpeciesIndex;

    if (slot) {
        if (slot === 'top' || slot === 'left') {
            visibleSpecies = [card.species[0]];
            forceSelectedIdx = 0;
        } else if (slot === 'bottom' || slot === 'right') {
            visibleSpecies = [card.species[1]];
            forceSelectedIdx = 0; // It's a new 1-length array
        }
    }

    return (
        <div
            className={classNames}
            onClick={onClick}
            ref={cardRef}
            style={artworkStyle}
            role={onClick ? 'button' : undefined}
            aria-label={card.species.map(species => species.name).join(' / ') || `Winter card ${card.cardId}`}
        >
            {!artworkStyle && !slot && <div className="card-id">#{card.cardId}</div>}
            <div className="card-inner">
                {visibleSpecies.map((s, idx) => (
                    <div
                        key={idx}
                        className={`species-half ${forceSelectedIdx === idx ? 'species-selected' : ''}`}
                        onMouseEnter={(e) => handleMouseEnter(idx, e)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {!artworkStyle && (
                            <div className="protrusion-info">
                                <div className="card-header">
                                    <span className="name">{s.name}</span>
                                    <span className="cost">{s.speciesData.cost}</span>
                                </div>
                                {s.treeSymbol && (
                                    <div className="tree-symbol">🌳 {s.treeSymbol}</div>
                                )}
                            </div>
                        )}

                        {hoveredIndex === idx && (
                            <TooltipPortal
                                species={s}
                                cardId={card.cardId}
                                deck={card.deck}
                                anchorRect={anchorRect}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
