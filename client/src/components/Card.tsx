import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EnhancedCard, SpeciesData, TreeSymbol } from '../../../shared/types';
import { getCardArtwork } from './cardArtwork';
import { useI18n } from '../i18n';
import { translateCardTag, translateCardText, translateSpeciesName, translateTreeSymbol } from '../data/cardTranslations.zh-CN';
import GameIcon from './GameIcon';
import { iconForTag, iconForTreeSymbol } from './gameIconData';

const cardDescriptionDelayMs = 600;
const cardDescriptionLeaveDelayMs = 120;
const tooltipWidthPx = 260;
const tooltipViewportPaddingPx = 12;
const tooltipCardGapPx = 10;

interface CardProps {
    card: EnhancedCard;
    isSelected?: boolean;
    isCostSelected?: boolean;
    selectedSpeciesIndex?: number;
    onClick?: () => void;
    slot?: 'top' | 'bottom' | 'left' | 'right';
}

interface TooltipProps {
    species: { name: string; speciesData: SpeciesData; treeSymbol?: TreeSymbol };
    cardId: number;
    deck: string;
    anchorRect: DOMRect | null;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

interface TooltipPosition {
    placement: 'above' | 'below';
    top: number;
}

function TooltipPortal({ species, cardId, deck, anchorRect, onMouseEnter, onMouseLeave }: TooltipProps) {
    const { language, t } = useI18n();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<TooltipPosition | null>(null);
    const localize = (text: string, kind: 'effect' | 'bonus' | 'points') =>
        language === 'zh-CN' ? translateCardText(text, kind) : text;

    const idealLeft = anchorRect ? anchorRect.left + (anchorRect.width / 2) : 0;
    const minimumLeft = (tooltipWidthPx / 2) + tooltipViewportPaddingPx;
    const maximumLeft = Math.max(
        minimumLeft,
        window.innerWidth - (tooltipWidthPx / 2) - tooltipViewportPaddingPx
    );
    const left = Math.min(Math.max(idealLeft, minimumLeft), maximumLeft);

    useLayoutEffect(() => {
        if (!anchorRect || !tooltipRef.current) return;

        const tooltipHeight = Math.min(
            tooltipRef.current.getBoundingClientRect().height,
            window.innerHeight - (tooltipViewportPaddingPx * 2)
        );
        const spaceAbove = anchorRect.top - tooltipCardGapPx - tooltipViewportPaddingPx;
        const spaceBelow = window.innerHeight - anchorRect.bottom - tooltipCardGapPx - tooltipViewportPaddingPx;
        const placeAbove = tooltipHeight <= spaceAbove || spaceAbove >= spaceBelow;
        const preferredTop = placeAbove
            ? anchorRect.top - tooltipCardGapPx - tooltipHeight
            : anchorRect.bottom + tooltipCardGapPx;
        const maximumTop = Math.max(
            tooltipViewportPaddingPx,
            window.innerHeight - tooltipViewportPaddingPx - tooltipHeight
        );

        setPosition({
            placement: placeAbove ? 'above' : 'below',
            top: Math.min(Math.max(preferredTop, tooltipViewportPaddingPx), maximumTop),
        });
    }, [anchorRect, cardId, deck, language, species]);

    if (!anchorRect) return null;

    const style: React.CSSProperties = {
        position: 'fixed',
        top: `${position?.top ?? tooltipViewportPaddingPx}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999,
    };

    return createPortal(
        <div
            ref={tooltipRef}
            className={`details-tooltip ${position ? `placement-${position.placement} is-visible` : ''}`}
            style={style}
            role="tooltip"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="tooltip-header">
                {language === 'zh-CN' ? translateSpeciesName(species.name) : species.name} <span className="tooltip-id">#{cardId}</span>
            </div>
            <div className="tooltip-meta">
                <span className="tooltip-cost">{t('cost')}: {species.speciesData.cost}</span>
                <span className="tooltip-deck">{t('deck')}: {deck === 'basic' ? t('baseGame') : deck === 'alpine' ? t('alpine') : t('edge')}</span>
            </div>
            <div className="tooltip-tags">
                {species.speciesData.tags.map(tag => (
                    <span key={tag} className={`tag tag-${tag.toLowerCase().replace(/\|(?!\s)/g, '-').replace(/\s+/g, '-')}`}>
                        <GameIcon name={iconForTag(tag)} />
                        {language === 'zh-CN' ? translateCardTag(tag) : tag}
                    </span>
                ))}
            </div>
            {species.treeSymbol && (
                <div className="tooltip-symbol">
                    <GameIcon name={iconForTreeSymbol(species.treeSymbol)} />
                    {t('symbol')}: {language === 'zh-CN' ? translateTreeSymbol(species.treeSymbol) : species.treeSymbol}
                </div>
            )}
            {species.speciesData.effect && (
                <div className="tooltip-effect">
                    <strong>{t('effect')}:</strong> {localize(species.speciesData.effect, 'effect')}
                </div>
            )}
            {species.speciesData.bonus && (
                <div className="tooltip-bonus">
                    <strong>{t('bonus')}:</strong> {localize(species.speciesData.bonus, 'bonus')}
                </div>
            )}
            {species.speciesData.points && (
                <div className="tooltip-points">
                    <GameIcon name="points" />
                    <span><strong>{t('points')}:</strong> {localize(species.speciesData.points, 'points')}</span>
                </div>
            )}
        </div>,
        document.body
    );
}

export default function Card({ card, isSelected, isCostSelected, selectedSpeciesIndex, onClick, slot }: CardProps) {
    const { language, t } = useI18n();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const descriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const descriptionLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearDescriptionTimer = () => {
        if (descriptionTimerRef.current) {
            clearTimeout(descriptionTimerRef.current);
            descriptionTimerRef.current = null;
        }
    };

    const clearDescriptionLeaveTimer = () => {
        if (descriptionLeaveTimerRef.current) {
            clearTimeout(descriptionLeaveTimerRef.current);
            descriptionLeaveTimerRef.current = null;
        }
    };

    const hideDescription = () => {
        setHoveredIndex(null);
        setAnchorRect(null);
    };

    useEffect(() => () => {
        clearDescriptionTimer();
        clearDescriptionLeaveTimer();
    }, []);

    const handleMouseEnter = (index: number, e: React.MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        clearDescriptionTimer();
        clearDescriptionLeaveTimer();
        setHoveredIndex(null);
        setAnchorRect(target.getBoundingClientRect());
        descriptionTimerRef.current = setTimeout(() => {
            setHoveredIndex(index);
            descriptionTimerRef.current = null;
        }, cardDescriptionDelayMs);
    };

    const handleMouseLeave = () => {
        clearDescriptionTimer();
        clearDescriptionLeaveTimer();
        descriptionLeaveTimerRef.current = setTimeout(() => {
            hideDescription();
            descriptionLeaveTimerRef.current = null;
        }, cardDescriptionLeaveDelayMs);
    };

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
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            } : undefined}
            aria-label={card.species.map(species => language === 'zh-CN' ? translateSpeciesName(species.name) : species.name).join(' / ') || `${t('winterCard')} ${card.cardId}`}
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
                                    <span className="name">{language === 'zh-CN' ? translateSpeciesName(s.name) : s.name}</span>
                                    <span className="cost">{s.speciesData.cost}</span>
                                </div>
                                {s.treeSymbol && (
                                    <div className="tree-symbol">
                                        <GameIcon name={iconForTreeSymbol(s.treeSymbol)} />
                                        {language === 'zh-CN' ? translateTreeSymbol(s.treeSymbol) : s.treeSymbol}
                                    </div>
                                )}
                            </div>
                        )}

                        {hoveredIndex === idx && (
                            <TooltipPortal
                                species={s}
                                cardId={card.cardId}
                                deck={card.deck}
                                anchorRect={anchorRect}
                                onMouseEnter={clearDescriptionLeaveTimer}
                                onMouseLeave={handleMouseLeave}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
