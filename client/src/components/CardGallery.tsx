import { useMemo, useState } from 'react';
import type { CardOrientation, DeckType, EnhancedCard } from '../../../shared/types';
import { cardCatalog } from '../data/cardCatalog';
import Card from './Card';
import { useI18n } from '../i18n';
import { translateCardTag, translateCardText, translateSpeciesName, translateTreeSymbol } from '../data/cardTranslations.zh-CN';
import './CardGallery.css';
import GameIcon from './GameIcon';
import { iconForTag, iconForTreeSymbol } from './gameIconData';

type DeckFilter = 'all' | DeckType;
type OrientationFilter = 'all' | CardOrientation;

interface CardGalleryProps {
  onBack: () => void;
}

const artworkKey = (card: EnhancedCard) => card.orientation === 'Tree' || card.isWinterCard
  ? `${card.deck}:${card.species[0]?.name ?? 'winter'}`
  : `${card.deck}:${card.cardId}`;

export default function CardGallery({ onBack }: CardGalleryProps) {
  const { language, t } = useI18n();
  const speciesName = (name: string) => language === 'zh-CN' ? translateSpeciesName(name) : name;
  const cardText = (text: string, kind: 'effect' | 'bonus' | 'points') =>
    language === 'zh-CN' ? translateCardText(text, kind) : text;
  const deckLabels: Record<DeckType, string> = {
    basic: t('baseGame'), alpine: t('alpine'), edge: t('edge')
  };
  const orientationLabels: Record<CardOrientation, string> = {
    Tree: t('trees'), hCard: t('leftRight'), vCard: t('topBottom'), wCard: t('winter')
  };
  const [search, setSearch] = useState('');
  const [deck, setDeck] = useState<DeckFilter>('all');
  const [orientation, setOrientation] = useState<OrientationFilter>('all');
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [selectedCard, setSelectedCard] = useState<EnhancedCard | null>(null);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    const seenArtwork = new Set<string>();
    return cardCatalog.filter(card => {
      if (deck !== 'all' && card.deck !== deck) return false;
      if (orientation !== 'all' && card.orientation !== orientation) return false;
      if (query && !String(card.cardId).includes(query) &&
        !card.species.some(species => species.name.toLowerCase().includes(query) ||
          translateSpeciesName(species.name).includes(search.trim()))) return false;
      if (!hideDuplicates) return true;
      const key = artworkKey(card);
      if (seenArtwork.has(key)) return false;
      seenArtwork.add(key);
      return true;
    });
  }, [deck, hideDuplicates, orientation, search]);

  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <button className="gallery-back" onClick={onBack}>← {t('backToLobby')}</button>
        <div>
          <p className="gallery-kicker">{t('cardReference')}</p>
          <h1>{t('galleryTitle')}</h1>
          <p>{t('galleryIntro')}</p>
        </div>
      </header>

      <section className="gallery-controls" aria-label={t('cardFilters')}>
        <label className="gallery-search">
          <span>{t('search')}</span>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setSelectedCard(null);
            }}
          />
        </label>
        <label>
          <span>{t('deck')}</span>
          <select value={deck} onChange={event => {
            setDeck(event.target.value as DeckFilter);
            setSelectedCard(null);
          }}>
            <option value="all">{t('allDecks')}</option>
            {Object.entries(deckLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('cardType')}</span>
          <select value={orientation} onChange={event => {
            setOrientation(event.target.value as OrientationFilter);
            setSelectedCard(null);
          }}>
            <option value="all">{t('allTypes')}</option>
            {Object.entries(orientationLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="gallery-checkbox">
          <input
            type="checkbox"
            checked={hideDuplicates}
            onChange={event => {
              setHideDuplicates(event.target.checked);
              setSelectedCard(null);
            }}
          />
          {t('hideDuplicates')}
        </label>
      </section>

      <div className="gallery-summary">
        {t('physicalCards', { shown: filteredCards.length, total: cardCatalog.length })}
      </div>

      <div className="gallery-layout">
        <section className="gallery-grid" aria-label={t('cards')}>
          {filteredCards.map(card => (
            <article key={card.cardId} className="gallery-card">
              <Card
                card={card}
                isSelected={selectedCard?.cardId === card.cardId}
                onClick={() => setSelectedCard(card)}
              />
              <div className="gallery-card-caption">
                <span>#{card.cardId}</span>
                <span>{deckLabels[card.deck]}</span>
              </div>
            </article>
          ))}
          {filteredCards.length === 0 && (
            <p className="gallery-empty">{t('noCards')}</p>
          )}
        </section>

        <aside className={`gallery-details ${selectedCard ? 'open' : ''}`} aria-live="polite">
          {selectedCard ? (
            <>
              <div className="gallery-details-heading">
                <div>
                  <span>{t('cardNumber', { number: selectedCard.cardId })}</span>
                  <h2>{selectedCard.species.map(species => speciesName(species.name)).join(' / ') || t('winterCard')}</h2>
                </div>
                <button onClick={() => setSelectedCard(null)} aria-label={t('closeDetails')}>×</button>
              </div>
              <div className="gallery-details-meta">
                <span>{deckLabels[selectedCard.deck]}</span>
                <span>{orientationLabels[selectedCard.orientation]}</span>
              </div>
              {selectedCard.species.map((species, index) => (
                <section key={`${species.name}-${index}`} className="gallery-species-details">
                  <h3>{speciesName(species.name)}</h3>
                  <div className="gallery-species-meta">
                    <span>{t('cost')} {species.speciesData.cost}</span>
                    {species.treeSymbol && <span><GameIcon name={iconForTreeSymbol(species.treeSymbol)} />{t('treeSymbol')}: {language === 'zh-CN' ? translateTreeSymbol(species.treeSymbol) : species.treeSymbol}</span>}
                  </div>
                  <div className="gallery-tags">
                    {species.speciesData.tags.map(tag => <span key={tag}><GameIcon name={iconForTag(tag)} />{language === 'zh-CN' ? translateCardTag(tag) : tag}</span>)}
                  </div>
                  {species.speciesData.effect && <p><strong>{t('effect')}:</strong> {cardText(species.speciesData.effect, 'effect')}</p>}
                  {species.speciesData.bonus && <p><strong>{t('bonus')}:</strong> {cardText(species.speciesData.bonus, 'bonus')}</p>}
                  {species.speciesData.points && <p className="gallery-points"><GameIcon name="points" /><span><strong>{t('points')}:</strong> {cardText(species.speciesData.points, 'points')}</span></p>}
                </section>
              ))}
            </>
          ) : (
            <div className="gallery-details-placeholder">
              <span>↖</span>
              <p>{t('selectCardDetails')}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
