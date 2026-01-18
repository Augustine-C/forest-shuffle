var debug = "studio.boardgamearena.com" == window.location.host || window.location.hash.indexOf("debug") > -1 ? console.info.bind(window.console) : function () { };
define(["dojo", "dojo/_base/declare", "ebg/core/gamegui", "ebg/counter", g_gamethemeurl + "modules/js/Core/game.js", g_gamethemeurl + "modules/js/Core/modal.js", g_gamethemeurl + "modules/js/card.js", g_gamethemeurl + "modules/js/Utils/utils.js", g_gamethemeurl + "modules/js/Utils/cheatModule.js"], function (e, t) {
    return t("bgagame.forestshuffle", [customgame.game, forestshuffle.utils, forestshuffle.cheatModule], {
        constructor() {
            debug("forestshuffle constructor");
            this._activeStates = ["playerTurn", "mulligan", "retake", "freePlayAll", "freePlay", "hibernate", "playAll", "takeCardFromClearing", "hibernateGypaetus"];
            this._notifications = [["clearClearing", 1e3], ["takeCardFromClearing", 500], ["takeAllClearing", 500], ["newCardOnClearing", 500], ["newWinterCard", 4e3], ["playCard", 500], ["newScores", 0], ["myHibernate", 500], ["hibernateGypaetus", 500], ["hibernate", 500, e => e.args.player_id == this.player_id], ["mulligan", 1e3, e => e.args.player_id == this.player_id], ["takeCardFromDeck", 500, e => e.args.player_id == this.player_id], ["willTakeCardFromDeck", 500], ["undo", 500], ["refresh", 0], ["putCardOnClearing", 300], ["receiveCards", 300], ["refreshCounters", 0]];
            this.default_viewport = "width=800"
        },
        setup(t) {
            debug("setup", t);
            t.isAlpine || this.dontPreloadImage("mountain.jpg");
            t.isWoodlands || this.dontPreloadImage("woodlands.Jpg");
            onresize = e => {
                this.adaptWidth()
            };
            this.counters = [];
            this.counters.caves = [];
            this.counters.hands = [];
            this.counters.deck = this.addCounterOnDeck("deck", t.cards.deck_count);
            this.counters.discard = this.addCounterOnDeck("discard", t.cards.discard_count);
            this.counters.clearing = this.addCounterOnDeck("board", Object.values(t.cards.clearing).length, !1);
            for (const e in t.cards.clearing)
                this.createCardInClearing(e);
            for (const e in t.players) {
                const a = t.players[e];
                this.place("tplPlayerPanel", a, `overall_player_board_${a.id}`);
                this.counters.caves[a.id] = this.createCounter(`cave-counter-${a.id}`, a.cave);
                this.counters.hands[a.id] = this.createCounter(`card-counter-${a.id}`, this.player_id == a.id ? Object.values(a.hand).length : a.hand);
                this.place("table_tpl", a, "tables");
                if (this.player_id == e)
                    for (const e in a.hand)
                        this.createCardInHand(e);
                for (const t in a.trees)
                    this.addCardToTable(t, e, a.trees[t].tree, a.trees[t].position, !1);
                for (const t in a.table)
                    this.addCardToTable(t, e, a.table[t].tree, a.table[t].position, !1);
                for (const e in a.table)
                    this.createTooltip(e, t.scoresByCards[e])
            }
            this.myUpdatePlayerOrdering("table", "tables");
            this.addTooltipToClass("cards-counter", _("Cards in player hand"), "");
            this.addTooltipToClass("cave-counter", _("Cards in player cave (score 1 point each)"), "");
            e.connect($("pin"), "onclick", t => {
                e.toggleClass("cards", "changed");
                window.localStorage.setItem("pinned", $("cards").classList.contains("changed"))
            });
            "true" == window.localStorage.getItem("pinned") && $("pin").click();
            this.place("winter_tpl", t.cards.winterCards, "player_boards");
            t.cards.winterCards.forEach(e => {
                this.place("card_tpl", e, "wCardStorage");
                this.createTooltip(e)
            });
            this.counters.winterCard = this.createCounter("counter-wCard", t.cards.winterCards.length);
            e.connect($("zoom_value"), "oninput", () => {
                window.localStorage.setItem("FOS_zoom", $("zoom_value").value);
                this.adaptWidth()
            });
            this.adaptWidth();
            2 == t.cards.winterCards.length && this.displayCaution();
            let a = $("help-mode-chk");
            e.connect(a, "onchange", () => {
                this.toggleHelpMode(a.checked)
            });
            this.addTooltip("help-mode-switch", "", _("Toggle help mode."));
            t.cheatModule && this.cheatModuleSetup(t);
            this.inherited(arguments);
            debug("Ending game setup")
        },
        onUpdateActivityDraft(e) {
            this.activateDraftButtons()
        },
        onLeavingStateDraft() {
            this._helpMode && $("help-mode-chk").click();
            e.query("#forestShuffle-choose-card .card").forEach(e => {
                this.smartDestroy(e.id)
            })
        },
        onEnteringStateDraft(t) {
            this._helpMode || $("help-mode-chk").click();
            this.addPrimaryActionButton("btn_show", _("Show cards"), () => this.modal.show());
            this.modal = new customgame.modal("showCards", {
                class: "popin",
                closeIcon: "fa-times",
                title: this.fsr(this.gamedatas.gamestate.descriptionmyturn, t),
                closeAction: "hide",
                autoShow: !0,
                contentsTpl: '<div id=\'forestShuffle-choose-card\'></div><div id="forestShuffle-choose-card-footer" class="active"></div>'
            });
            const a = ["nothing", "keep", "left", "right", "clearing", "trash"].filter(e => "nothing" == e || t["n" + ucFirst(e)] > 0);
            a.forEach(a => {
                "nothing" != a && e.place(`<div id='hint_${a}' class='tinyHint ${a}'>${t["n" + ucFirst(a)]}</div>`, "forestShuffle-choose-card-footer")
            });
            this.addTooltipToClass("trash", _("cards to trash"), "");
            this.addTooltipToClass("keep", _("cards to keep"), "");
            this.addTooltipToClass("left", this.fsr("cards to give to ${leftPlayer}", {
                leftPlayer: t._private.leftPlayer
            }), "");
            this.addTooltipToClass("right", this.fsr("cards to give to ${rightPlayer}", {
                rightPlayer: t._private.rightPlayer
            }), "");
            this.addTooltipToClass("clearing", _("cards to put in the clearing"), "");
            Object.entries(t._private.cards).forEach(([e, s]) => {
                this.createCard(e, "topbar");
                this.genericMove("card_" + e, "forestShuffle-choose-card", !1);
                const i = $(`card_${e}`);
                i.classList.add(a[0]);
                this.onClick(`card_${e}`, () => {
                    if (!this.isCurrentPlayerActive())
                        return;
                    let e = "";
                    for (let t = 0; t < a.length; t++) {
                        e = a[t];
                        if (i.classList.contains(e)) {
                            let s = "";
                            for (let e = 1; e <= a.length; e++) {
                                s = a[(t + e) % a.length];
                                if (!$("hint_" + s) || !$("hint_" + s).classList.contains("validated"))
                                    break
                            }
                            i.classList.remove(e);
                            i.classList.add(s);
                            break
                        }
                    }
                    this.checkDraftChoices(t, a)
                })
            });
            Object.entries(t._private.choices).forEach(([e, t]) => {
                t.forEach(t => {
                    $(`card_${t}`).classList.add(e)
                })
            });
            this.addPrimaryActionButton("btn_draft", _("Draft"), () => {
                let t = {};
                ["keep", "left", "right", "clearing", "trash"].forEach(a => {
                    t[a] = e.query(".card." + a).map(e => e.dataset.id)
                });
                this.takeAction("actGiveCards", {
                    cards: JSON.stringify(t)
                }, !1);
                this.modal.hide()
            }, "forestShuffle-choose-card-footer");
            this.addPrimaryActionButton("btn_reset", _("Change mind"), () => {
                this.takeAction("actChangeMind", {}, !1);
                a.forEach(t => {
                    "nothing" != t && e.query(".card." + t).removeClass(t).addClass("nothing")
                });
                this.checkDraftChoices(t, a)
            }, "forestShuffle-choose-card-footer");
            e.addClass("btn_draft", "disabled");
            this.checkDraftChoices(t, a)
        },
        onEnteringStateFreePlayAll(e) {
            this.onEnteringStateFreePlay(e)
        },
        onEnteringStateFreePlay(t) {
            Object.keys(t._private.playableSpecies).forEach(e => {
                this.onClick("card_" + e, a => {
                    this.selectCardToPlay(a, t._private.playableSpecies[e])
                }, !0)
            });
            if ("sapling" == t.suffix) {
                this.addPrimaryActionButton("btn-sapling", _("Play as tree sapling"), () => {
                    const t = this.getCardIdFromDiv(e.query("#cards .selected")[0]);
                    this.takeAction("playCard", {
                        cardId: t,
                        position: "sapling"
                    })
                });
                e.addClass("btn-sapling", "disabled")
            } else {
                this.addPrimaryActionButton("btn-pay", _("Play Card"), () => {
                    this.onPressButtonPlayCard()
                });
                e.addClass("btn-pay", "disabled")
            }
            this.addDangerActionButton("btn_pass", _("Pass"), () => {
                this.takeAction("pass")
            })
        },
        onEnteringStateHibernate(t) {
            t._private.playableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToDiscard(e)
                }, !0)
            });
            this.addPrimaryActionButton("btn-discard", _("Send to Cave"), () => {
                const e = this.buildJSONIds(".selected");
                debug(e);
                this.takeAction("hibernate", {
                    cards: e
                })
            });
            e.addClass("btn-discard", "disabled");
            this.addDangerActionButton("btn_pass", _("Pass"), () => {
                this.takeAction("pass")
            })
        },
        onEnteringStateTakeCardFromClearing(t) {
            t.playableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToDiscardGypaetus(e, t.nb)
                }, !0)
            });
            const a = "cave" == t.where ? _("Send to Cave") : _("Take in hand");
            this.addPrimaryActionButton("btn-discard", a, () => {
                const a = () => {
                    const e = this.buildJSONIds(".selected");
                    this.takeAction("actChooseCard", {
                        cards: e
                    })
                };
                e.query(".selected").length < t.nb ? this.confirmationDialog(_("You could select more cards"), a) : a()
            });
            e.addClass("btn-discard", "disabled");
            this.addDangerActionButton("btn_pass", _("Pass"), () => {
                this.confirmationDialog(_("You give up taking cards"), () => {
                    this.takeAction("pass")
                })
            })
        },
        onEnteringStateActChooseCard(e) {
            this.onEnteringStateHibernateGypaetus(e)
        },
        onEnteringStateHibernateGypaetus(t) {
            t.playableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToDiscardGypaetus(e)
                }, !0)
            });
            this.addPrimaryActionButton("btn-discard", _("Send to Cave"), () => {
                const e = this.buildJSONIds(".selected");
                this.takeAction("actChooseCard", {
                    cards: e
                })
            });
            e.addClass("btn-discard", "disabled");
            this.addDangerActionButton("btn_pass", _("Pass"), () => {
                this.takeAction("pass")
            })
        },
        onEnteringStateMulligan(e) {
            e._private.canMulligan && this.addPrimaryActionButton("btn_mulligan", _("Change cards"), () => {
                this.takeAction("changeCards")
            });
            this.addPrimaryActionButton("btn_pass", _("Pass"), () => {
                this.takeAction("passMulligan")
            })
        },
        onUpdateActivityMulligan(e, t) {
            t || this.clearActionButtons()
        },
        onEnteringStatePlayAll(t) {
            debug("enteringPlayAll", t);
            this.overcost = t.overcost ? t.overcost : 0;
            t._private.playableCards.forEach(e => {
                this.onClick("card_" + e, a => {
                    this.selectCardToPlay(a, t._private.playableSpecies ? t._private.playableSpecies[e] : void 0)
                }, !0)
            });
            if ("sapling" != t.suffix) {
                this.addPrimaryActionButton("btn-pay", _("Play Card"), () => {
                    this.onPressButtonPlayCard()
                });
                e.addClass("btn-pay", "disabled")
            }
            this.addDangerActionButton("btn_pass", _("Pass"), () => {
                this.takeAction("pass")
            });
            t._private.canUndo && this.addDangerActionButton("btn-undo", _("Cancel"), () => {
                this.takeAction("undo")
            });
            this.addSecondaryActionButton("btn-sapling", _("Play as tree sapling"), () => {
                this.confirmationDialog(_("Are you sure you want to play this card face down?"), () => {
                    const t = this.getCardIdFromDiv(e.query("#cards .selected")[0]);
                    this.takeAction("playCard", {
                        cardId: t,
                        position: "sapling"
                    })
                })
            });
            e.addClass("btn-sapling", "disabled")
        },
        onEnteringStateRetake(t) {
            t._private.takableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToTake(e)
                }, !0)
            });
            t._private.canTake && this.onClick("deck", e => {
                this.selectDeck()
            }, !0);
            this.addPrimaryActionButton("btn-take", _("Take Card"), () => {
                this.onPressButtonTakeCard()
            });
            e.addClass("btn-take", "disabled")
        },
        onEnteringStatePlayerTurn(t) {
            t._private.playableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToPlay(e)
                }, !0)
            });
            t._private.takableCards.forEach(e => {
                this.onClick("card_" + e, e => {
                    this.selectCardToTake(e)
                }, !0)
            });
            t._private.canTake && this.onClick("deck", e => {
                this.selectDeck()
            }, !0);
            this.addPrimaryActionButton("btn-take", _("Take Card"), () => {
                this.onPressButtonTakeCard()
            });
            this.addPrimaryActionButton("btn-pay", _("Play Card"), () => {
                this.onPressButtonPlayCard()
            });
            this.addSecondaryActionButton("btn-sapling", _("Play as tree sapling"), () => {
                this.confirmationDialog(_("Are you sure you want to play this card face down?"), () => {
                    const t = this.getCardIdFromDiv(e.query("#cards .selected")[0]);
                    this.takeAction("playCard", {
                        cardId: t,
                        position: "sapling"
                    })
                })
            });
            e.addClass("btn-pay", "disabled");
            e.addClass("btn-take", "disabled");
            e.addClass("btn-sapling", "disabled")
        },
        displayCaution() {
            let t = _("Caution: only one winter card remaining!");
            e.place('<div id="FOS_message">' + t + "</div>", "FOS_caution", "first");
            e.connect($("FOS_caution"), "onclick", this, () => {
                e.destroy("FOS_message")
            })
        },
        buildJSONIds(t) {
            return JSON.stringify(e.query(t).map(e => this.getCardIdFromDiv(e)))
        },
        getCardIdFromDiv: e => e.id.split("_")[1],
        resetSelectionToPlay() {
            e.query("#cards .selected").removeClass("selected");
            e.query(".selectedToPay").removeClass("selectedToPay");
            e.query(".futurePlace.selectable").removeClass("selectable selected");
            e.query("#FOStable_" + this.player_id + " .futurePlace").attr("data-id", 0);
            e.query(".hare, .toad, .butterfly").removeClass("selectable selected");
            this.cost = -1;
            this.updatePageTitle()
        },
        selectDeck() {
            e.toggleClass("deck", "selected");
            this.resetSelectionToPlay();
            e.query("#clearing .selected").removeClass("selected");
            $("deck").classList.contains("selected") ? $("pagemaintitletext").innerHTML = _("You can take a card from deck") : this.updatePageTitle();
            this.updateButtons()
        },
        selectCardToDiscard(t) {
            e.toggleClass(t.currentTarget.id, "selected");
            0 == e.query(".selected").length ? e.addClass("btn-discard", "disabled") : e.removeClass("btn-discard", "disabled")
        },
        selectCardToDiscardGypaetus(t, a = 2) {
            e.toggleClass(t.currentTarget.id, "selected");
            0 == e.query(".selected").length || e.query(".selected").length > a ? e.addClass("btn-discard", "disabled") : e.removeClass("btn-discard", "disabled")
        },
        selectCardToTake(t) {
            this.resetSelectionToPlay();
            $("deck").classList.remove("selected");
            const a = t.currentTarget,
                s = this.getCardIdFromDiv(a);
            if (a.classList.contains("selected")) {
                a.classList.remove("selected");
                this.updatePageTitle()
            } else {
                e.query("#clearing .selected").removeClass("selected");
                a.classList.add("selected");
                $("pagemaintitletext").innerHTML = this.fsr(_("You can take ${card} card from clearing"), this.getTranslatableName(s))
            }
            this.updateButtons()
        },
        getTranslatableName: e => 2 == CARDS_DATA[e].species.length ? {
            card: {
                log: _("${specie1} / ${specie2}"),
                args: {
                    i18n: ["specie1", "specie2"],
                    specie1: CARDS_DATA[e].species[0],
                    specie2: CARDS_DATA[e].species[1]
                }
            },
            i18n: ["card"]
        } : {
            card: CARDS_DATA[e].species[0],
            i18n: ["card"]
        },
        selectCardToPlay(t, a = null) {
            debug("selectCardToPlay", t, a);
            e.query("#clearing .selected, #deck").removeClass("selected");
            const s = t.currentTarget,
                i = this.getCardIdFromDiv(s);
            if (s.classList.contains("selected"))
                this.resetSelectionToPlay();
            else if (s.classList.contains("selectedToPay"))
                s.classList.remove("selectedToPay");
            else if (0 != e.query("#cards .selected").length)
                s.classList.add("selectedToPay");
            else {
                s.classList.add("selected");
                const t = CARDS_DATA[i].type;
                if (t == TREE)
                    this.setNewTitle(i, !1);
                else {
                    this.selectCardsWhereStack(i, a);
                    const s = a ? a.map(e => "#FOStable_" + this.player_id + " .futurePlace." + t + "." + e).join(",") : "#FOStable_" + this.player_id + " .futurePlace." + t;
                    e.query(s).forEach(e => {
                        e.dataset.id = i;
                        this.onClick(e, e => {
                            this.selectWhereToPlay(e)
                        }, !0)
                    });
                    0 != e.query(".selectable.futurePlace").length ? $("pagemaintitletext").innerHTML = _("Choose where to place this card") : $("pagemaintitletext").innerHTML = _("You can only place this card face down")
                }
            }
            this.updateButtons()
        },
        selectWhereToPlay(t) {
            const a = t.currentTarget;
            if (!a.classList.contains("selectable")) {
                debug("impossible, n'est plus selectable", t);
                return
            }
            e.query(".futurePlace.selectable, .toad.selectable, .hare.selectable, .butterfly.selectable").removeClass("selected");
            a.classList.add("selected");
            debug(e.query("#cards .selected")[0].id);
            const s = this.getCardIdFromDiv(e.query("#cards .selected")[0]);
            this.setNewTitle(s, a.classList.contains("onBottom") || a.classList.contains("onRight"))
        },
        checkMatchingTreeSymbols: t => e.query(".selectedToPay").every(e => CARDS_DATA[e.dataset.id].tree_symbol.includes(t)),
        setNewTitle(e, t) {
            const a = t ? 1 : 0,
                s = this.getDataFromSpecie(CARDS_DATA[e].species[a]);
            let i = !1;
            if ("freePlay" == this.gamedatas.gamestate.name || "freePlayAll" == this.gamedatas.gamestate.name)
                this.cost = 0;
            else {
                this.cost = s.cost + (this.overcost ?? 0);
                i = "" != s.bonus;
                this.treeSymbol = CARDS_DATA[e].tree_symbol[a]
            }
            $("pagemaintitletext").innerHTML = this.fsr(_("To place ${card}, you need to pay ${nb} card(s) ${bonus}"), {
                card: s.name,
                nb: this.cost,
                bonus: {
                    log: i ? _("(bonus: ${valid} )") : "",
                    args: {
                        valid: '<i id="bonus-icon" class="fa6 fa6-square-xmark"></i>'
                    }
                },
                i18n: ["card", "bonus"]
            });
            i && this.addTooltip("bonus-icon", _("To activate bonus, you need to pay with matching tree symbol"), "");
            this.updateButtons()
        },
        updateButtons() {
            null != $("btn-take") && (1 == e.query("#clearing .selected").length || $("deck").classList.contains("selected") ? e.removeClass("btn-take", "disabled") : e.addClass("btn-take", "disabled"));
            if (null != $("btn-pay"))
                if (e.query(".selectedToPay").length != this.cost) {
                    e.addClass("btn-pay", "disabled");
                    if (null != $("bonus-icon")) {
                        e.removeClass("bonus-icon", "fa6-square-check");
                        e.addClass("bonus-icon", "fa6-square-xmark")
                    }
                } else {
                    e.removeClass("btn-pay", "disabled");
                    if (null != $("bonus-icon"))
                        if (this.checkMatchingTreeSymbols(this.treeSymbol)) {
                            e.addClass("bonus-icon", "fa6-square-check");
                            e.removeClass("bonus-icon", "fa6-square-xmark")
                        } else {
                            e.removeClass("bonus-icon", "fa6-square-check");
                            e.addClass("bonus-icon", "fa6-square-xmark")
                        }
                }
            null != $("btn-sapling") && (0 != e.query("#cards .selected").length && 0 == e.query(".selectedToPay").length && 0 == e.query(".futurePlace.selected").length && 0 == e.query(".treeContainer .card.selected").length ? e.removeClass("btn-sapling", "disabled") : e.addClass("btn-sapling", "disabled"))
        },
        selectCardsWhereStack(t, a) {
            const s = CARDS_DATA[t].species;
            this.getDataFromSpecie(s[0]).tags.includes(BUTTERFLY) && ("onTop" == a || !a || Array.isArray(a) && a.includes("onTop")) && e.query("#FOStable_" + this.player_id + " .card.butterfly.onTop.available").forEach(e => {
                this.onClick(e, e => {
                    this.selectWhereToPlay(e)
                }, !0)
            });
            s[1] == COMMON_TOAD && ("onBottom" == a || !a || Array.isArray(a) && a.includes("onBottom")) && e.query("#FOStable_" + this.player_id + " .card.toad.onBottom:not(.busy)").forEach(e => {
                this.onClick(e, e => {
                    this.selectWhereToPlay(e)
                }, !0)
            });
            s[0] == EUROPEAN_HARE && ("onLeft" == a || null == a || Array.isArray(a) && a.includes("onLeft")) && e.query("#FOStable_" + this.player_id + " .card.hare.onLeft").forEach(e => {
                this.onClick(e, e => {
                    this.selectWhereToPlay(e)
                }, !0)
            });
            s[1] == EUROPEAN_HARE && ("onRight" == a || !a || Array.isArray(a) && a.includes("onRight")) && e.query("#FOStable_" + this.player_id + " .card.hare.onRight").forEach(e => {
                this.onClick(e, e => {
                    this.selectWhereToPlay(e)
                }, !0)
            })
        },
        getDataFromSpecie: e => SPECIES_DATA[e.replace(/[()-\s']/g, "")],
        createStack(t, a, s, i, r) {
            let d = a == COMMON_TOAD ? "toad" : a == EUROPEAN_HARE ? "hare" : a == URTICA ? "urtica" : "butterfly";
            e.query("#card_" + t).addClass(d);
            if ("urtica" == d) {
                const t = e.query("#tree_" + s + "_" + i + " .butterfly");
                if (t.length > 0) {
                    t.addClass("available");
                    this.counters[s + "_" + i + "_onTop"] = this.addCounterOnDeck(t[0].id, t.length);
                    return
                }
                return
            }
            if ("butterfly" == d) {
                if (!(e.query("#tree_" + s + "_" + i + " .urtica").length > 0))
                    return;
                e.query("#card_" + t).addClass("available")
            }
            if (1 == e.query("#tree_" + s + "_" + i + " .futurePlace." + r).length)
                this.counters[s + "_" + i + "_" + r] = this.addCounterOnDeck("card_" + t, 1);
            else {
                this.counters[s + "_" + i + "_" + r].incValue(1);
                e.query("#tree_" + s + "_" + i + " ." + d + ".card[data-tree-id=" + i + "]").addClass("busy")
            }
        },
        onPressButtonPlayCard() {
            const t = this.getCardIdFromDiv(e.query("#cards .selected")[0]),
                a = this.buildJSONIds("#cards .selectedToPay"),
                s = e.query(".futurePlace.selected, .toad.selected, .hare.selected, .available.selected")[0]?.dataset ? e.query(".futurePlace.selected, .toad.selected, .hare.selected, .available.selected")[0].dataset.position : TREE,
                i = e.query(".futurePlace.selected, .toad.selected, .hare.selected, .available.selected")[0]?.dataset.treeId;
            this.takeAction("playCard", {
                cardId: t,
                cards: a,
                treeId: i,
                position: s
            })
        },
        onPressButtonTakeCard() {
            if ($("deck").classList.contains("selected"))
                this.takeAction("takeCard");
            else {
                const t = this.getCardIdFromDiv(e.query("#clearing .selected")[0]);
                this.takeAction("takeCard", {
                    cardId: t
                })
            }
        },
        checkDraftChoices(t, a) {
            a.forEach(a => {
                e.query(".card." + a).length == t["n" + ucFirst(a)] ? e.query("#hint_" + a).addClass("validated") : e.query("#hint_" + a).removeClass("validated")
            });
            this.activateDraftButtons()
        },
        activateDraftButtons() {
            if (null != $("btn_draft"))
                if (this.isCurrentPlayerActive()) {
                    e.query("#forestShuffle-choose-card-footer div").every(e => e.classList.contains("validated")) ? e.removeClass("btn_draft", "disabled") : e.addClass("btn_draft", "disabled");
                    e.addClass("btn_reset", "disabled")
                } else {
                    e.addClass("btn_draft", "disabled");
                    e.removeClass("btn_reset", "disabled")
                }
        },
        notif_clearClearing(e) {
            debug("notif_clearClearing", e);
            this.clearClearing();
            this.counters.clearing.toValue(0)
        },
        notif_hibernate(e) {
            debug("notif_Hibernate", e);
            this.counters.hands[e.args.player_id].incValue(-e.args.nb);
            this.counters.caves[e.args.player_id].incValue(e.args.nb);
            for (let t = 0; t < e.args.nb; t++)
                this.pickFromDeck(e.args.player_id)
        },
        notif_hibernateGypaetus(e) {
            debug("notif_HibernateGypaetus", e);
            this.clearClearingToCave(e.args.player_id, e.args.cards);
            this.counters.clearing.incValue(-e.args.nb)
        },
        notif_myHibernate(e) {
            debug("notif_myHibernate", e);
            e.args.cards.forEach(e => {
                this.slideToObjectAndDestroy("card_" + e, "overall_player_board_" + this.player_id, 500)
            });
            e.args.newCards.forEach(e => {
                this.pickFromDeck(this.player_id, e.id)
            });
            this.counters.hands[e.args.player_id].incValue(-e.args.nb);
            this.counters.caves[e.args.player_id].incValue(e.args.nb)
        },
        notif_mulligan(e) {
            debug("notif_mulligan", e);
            if (e.args.player_id) {
                this.counters.hands[e.args.player_id].toValue(0);
                for (let t = 0; t < 6; t++)
                    this.pickFromDeck(e.args.player_id)
            } else {
                e.args.cards.forEach(e => {
                    this.pickFromDeck(this.player_id, e)
                });
                this.trashAllCards();
                this.counters.hands[this.player_id].toValue(0)
            }
        },
        notif_newCardOnClearing(e) {
            debug("notif_newCardOnClearing", e);
            this.pickFromDeck("clearing", e.args.cardId);
            this.counters.clearing.incValue(1)
        },
        notif_newScores(e) {
            debug("notif_newScores", e);
            for (const t in e.args.scores)
                this.scoreCtrl[t].toValue(e.args.scores[t]);
            for (const t in e.args.scoresByCards)
                this.createTooltip(t, e.args.scoresByCards[t])
        },
        notif_newWinterCard(e) {
            debug("notif_newWinterCard", e);
            this.pickFromDeck("wCard", e.args.wCardId);
            this.counters.winterCard.incValue(1);
            2 == this.counters.winterCard.getValue() && this.displayCaution()
        },
        notif_playCard(e) {
            debug("notif_playCard", e);
            this.addCardToTable(e.args.cardId, e.args.player_id, e.args.treeId, e.args.position);
            e.args.cards.forEach(t => {
                this.addCardToClearing(t, e.args.player_id);
                this.counters.clearing.incValue(1)
            })
        },
        notif_putCardOnClearing(e) {
            debug("notif_putCardOnClearing", e);
            this.createCardInClearing(e.args.cardId);
            this.counters.clearing.incValue(1)
        },
        notif_receiveCards(e) {
            debug("notif_receiveCards", e);
            e.args.cards.forEach(t => {
                this.receiveCard(t, e.args.player_id ?? this.player_id);
                this.forEachPlayer(e => this.counters.hands[e.id].incValue(1))
            })
        },
        notif_refreshCounters(e) {
            debug("notif refreshCounters", e);
            this.counters.deck.toValue(e.args.cards.deck_count);
            this.counters.discard.toValue(e.args.cards.discard_count);
            this.counters.clearing.toValue(Object.values(e.args.cards.clearing).length);
            this.forEachPlayer(t => {
                this.counters.hands[t.id].toValue(e.args.players[t.id].hand)
            })
        },
        notif_takeAllClearing(e) {
            debug("notif_takeAllClearing", e);
            this.clearClearingToCave(e.args.player_id, e.args.cards);
            this.counters.clearing.incValue(-e.args.nb)
        },
        notif_takeCardFromClearing(e) {
            debug("notif_takeCardFromClearing", e);
            this.pickFromClearing(e.args.cardId, e.args.player_id);
            this.counters.clearing.incValue(-1)
        },
        notif_takeCardFromDeck(e) {
            debug("notif_takeCardFromDeck", e);
            this.pickFromDeck(e.args.player_id ?? this.player_id, e.args.cardId)
        },
        notif_undo(t) {
            debug("notif_undo", t);
            let a = [];
            Object.values(t.args.cards).forEach(s => {
                const i = e.query("#card_" + s),
                    r = i[0].dataset.treeId,
                    d = i[0].dataset.position;
                d != TREE && "sapling" != d || a.push(i[0].parentElement.id);
                this.pickFromTable(s, t.args.player_id);
                e.removeClass("card_" + s, "onTop onBottom onLeft onRight sapling hare toad butterfly available ready busy");
                this.counters[t.args.player_id + "_" + r + "_" + d] && delete this.counters[t.args.player_id + "_" + r + "_" + d];
                $("card_" + s + "_deckinfo") && e.destroy("card_" + s + "_deckinfo");
                e.query("#tree_" + t.args.player_id + "_" + r + " :not([id*=card])." + d).addClass("futurePlace");
                i[0].dataset.position = "";
                i[0].dataset.treeId = ""
            });
            a.forEach(e => {
                this.smartDestroy(e)
            });
            this.counters.clearing.toValue(e.query("#clearing .card").length);
            this.clearPossible();
            e.query("#cards .card").forEach(e => {
                this.createTooltip(e.dataset.id);
                debug(e)
            })
        },
        createCardInHand(e) {
            this.createCard(e, "cards")
        },
        createCardInClearing(e) {
            this.createCard(e, "clearing")
        },
        createCard(e, t) {
            this.place("card_tpl", e, t);
            this.createTooltip(e)
        },
        receiveCard(e, t) {
            this.createCard(e, "overall_player_board_" + t);
            this.genericMove("card_" + e, "cards")
        },
        pickFromTable(e, t = null) {
            debug("pickFromTable", e, t);
            if (t != this.player_id) {
                this.slideToObjectAndDestroy("card_" + e, "overall_player_board_" + t, 500);
                this.wait(500).then(() => {
                    this.smartDestroy("card_" + e)
                })
            } else
                this.genericMove("card_" + e, "cards");
            this.counters.hands[t].incValue(1)
        },
        pickFromClearing(e, t = null) {
            debug("pickFromClearing", e, t);
            if (t != this.player_id) {
                this.slideToObjectAndDestroy("card_" + e, "player_name_" + t, 300, 0);
                setTimeout(() => {
                    this.smartDestroy("card_" + e)
                }, 300)
            } else
                this.genericMove("card_" + e, "cards");
            this.counters.hands[t].incValue(1)
        },
        clearClearingToCave(e, t) {
            for (let a = 0; a < t.length; a++) {
                const s = $("card_" + t[a]),
                    i = "item_" + a;
                this.flip(s, i).then(() => {
                    this.slideToObjectAndDestroy("card_" + i, "player_name_" + e, 300, 0);
                    setTimeout(() => {
                        this.smartDestroy("card_" + i);
                        this.counters.caves[e].incValue(1)
                    }, 300)
                })
            }
        },
        clearClearing() {
            const t = e.query("#clearing > .card");
            for (let e = 0; e < t.length; e++) {
                const a = t[e],
                    s = "item_" + e;
                this.flip(a.id, s).then(() => {
                    this.genericMove("card_" + s, "discard", !1, null, () => {
                        this.smartDestroy("card_" + s)
                    })
                }).then(() => {
                    this.counters.discard.incValue(1);
                    $("discard").classList.remove("empty")
                })
            }
        },
        flip(e, t = null) {
            const a = this.card_tpl(t);
            return this.flipAndReplace(e, a, 400).then(() => {
                isNaN(t) || this.createTooltip(t)
            })
        },
        addCardToClearing(t, a = null) {
            if (this.player_id == a && null != $("card_" + t)) {
                debug("addCardToClearing", t, a);
                this.genericMove("card_" + t, "clearing", !1)
            } else {
                e.place(this.card_tpl(t), $("overall_player_board_" + a), "first");
                this.createTooltip(t);
                this.genericMove("card_" + t, "clearing", !1)
            }
            a && this.counters.hands[a].incValue(-1)
        },
        addCardToTable(t, a, s, i = "", r = !0) {
            null == $("tree_" + a + "_" + s) && this.place("tree_tpl", {
                treeId: s,
                playerId: a,
                cardId: "sapling" == i ? 0 : t
            }, "FOStable_" + a);
            if (this.player_id == a && null != $("card_" + t))
                e.query("#card_" + t).addClass(i).attr("data-position", i).attr("data-tree-id", s);
            else {
                e.place(this.card_tpl(t, i), $("overall_player_board_" + a), "first");
                e.query("#card_" + t).attr("data-position", i).attr("data-tree-id", s)
            }
            this.genericMove("card_" + t, "tree_" + a + "_" + s, !1, "first", this.setReady);
            if ("sapling" != i) {
                this.createTooltip(t, this.gamedatas.scoresByCards[t]);
                const e = "onBottom" == i || "onRight" == i ? 1 : 0,
                    r = CARDS_DATA[t].species[e];
                r != COMMON_TOAD && r != EUROPEAN_HARE && r != URTICA && !this.getDataFromSpecie(r).tags.includes(BUTTERFLY) || "sapling" == i || this.createStack(t, r, a, s, i)
            }
            "" != i && e.query("#tree_" + a + "_" + s + " .futurePlace." + i).removeClass("futurePlace");
            r && this.counters.hands[a].incValue(-1)
        },
        pickFromDeck(t, a = null) {
            let s = 0;
            for (; null != $("card_item_" + s);)
                s++;
            const i = e.place(this.card_tpl("item_" + s), "deck");
            if (null == a) {
                this.slideToObjectAndDestroy(i.id, "overall_player_board_" + t, 500);
                this.counters.hands[t].incValue(1)
            } else
                this.flip(i.id, a).then(() => {
                    if (t == this.player_id) {
                        this.genericMove("card_" + a, "cards", !1);
                        this.counters.hands[t].incValue(1)
                    } else {
                        "clearing" == t && this.genericMove("card_" + a, "clearing");
                        "wCard" == t && this.showCard("card_" + a, !0, "wCardStorage")
                    }
                });
            this.counters.deck.incValue(-1)
        },
        setReady(e) {
            e.classList.add("animate-on-transforms");
            e.classList.add("ready");
            e.addEventListener("transitionend", () => {
                e.classList.remove("animate-on-transforms")
            })
        },
        trashAllCards() {
            let t = 0;
            e.query("#cards > .card").forEach(e => {
                this.slideToObjectAndDestroy(e.id, "topbar", 500, t);
                t += 200
            })
        },
        card_tpl(e, t = "") {
            if (!e)
                return '<div id="card_0" data-id="0" class="card back"></div>';
            if (isNaN(e))
                return `<div id="card_${e}" data-id="0" class="card back"></div>`;
            const a = CARDS_DATA[e];
            return `<div id="card_${e}" data-id="${e}" data-position='' class="card ${a.type} ${a.deck} ${t}"></div>`
        },
        table_tpl(e) {
            return `<div id='FOStable_${e.id}' class="whiteblock">\n      <div id='title_${e.id}'>\n      ${this.format_string_recursive("${player_name}", { player_name: e.name })}\n      </div>\n  </div>`
        },
        tree_tpl: e => `<div id='tree_${e.playerId}_${e.treeId}' data-id="${e.cardId}" class='treeContainer'>\n  <div data-tree-id="${e.treeId}" data-id="0" data-position='onTop' class='vCard onTop ready futurePlace'></div>\n  <div data-tree-id="${e.treeId}" data-id="0" data-position='onRight' class='hCard onRight ready futurePlace'></div>\n  <div data-tree-id="${e.treeId}" data-id="0" data-position='onBottom' class='vCard onBottom ready futurePlace'></div>\n  <div data-tree-id="${e.treeId}" data-id="0" data-position='onLeft' class='hCard onLeft ready futurePlace'></div>\n  </div>`,
        winter_tpl(e) {
            const t = _("Winter Cards :");
            return `<div class='player-board' id="player_board_config">\n  <div class="player_config_row">\n   <div id="help-mode-switch">\n     <input type="checkbox" class="checkbox" id="help-mode-chk" />\n     <label class="label" for="help-mode-chk">\n       <div class="ball"></div>\n     </label>\n\n     <svg aria-hidden="true" focusable="false" data-prefix="fad" data-icon="question-circle" class="svg-inline--fa fa-question-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g class="fa-group"><path class="fa-secondary" fill="currentColor" d="M256 8C119 8 8 119.08 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 422a46 46 0 1 1 46-46 46.05 46.05 0 0 1-46 46zm40-131.33V300a12 12 0 0 1-12 12h-56a12 12 0 0 1-12-12v-4c0-41.06 31.13-57.47 54.65-70.66 20.17-11.31 32.54-19 32.54-34 0-19.82-25.27-33-45.7-33-27.19 0-39.44 13.14-57.3 35.79a12 12 0 0 1-16.67 2.13L148.82 170a12 12 0 0 1-2.71-16.26C173.4 113 208.16 90 262.66 90c56.34 0 116.53 44 116.53 102 0 77-83.19 78.21-83.19 106.67z" opacity="0.4"></path><path class="fa-primary" fill="currentColor" d="M256 338a46 46 0 1 0 46 46 46 46 0 0 0-46-46zm6.66-248c-54.5 0-89.26 23-116.55 63.76a12 12 0 0 0 2.71 16.24l34.7 26.31a12 12 0 0 0 16.67-2.13c17.86-22.65 30.11-35.79 57.3-35.79 20.43 0 45.7 13.14 45.7 33 0 15-12.37 22.66-32.54 34C247.13 238.53 216 254.94 216 296v4a12 12 0 0 0 12 12h56a12 12 0 0 0 12-12v-1.33c0-28.46 83.19-29.67 83.19-106.67 0-58-60.19-102-116.53-102z"></path></g></svg>\n   </div>\n   <div>\n   <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM136 184c-13.3 0-24 10.7-24 24s10.7 24 24 24H280c13.3 0 24-10.7 24-24s-10.7-24-24-24H136z"/></svg>\n   <input type="range" min="50" max="200" value="${window.localStorage?.getItem("FOS_zoom") ?? 100}" class="slider" id="zoom_value">\n    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM184 296c0 13.3 10.7 24 24 24s24-10.7 24-24V232h64c13.3 0 24-10.7 24-24s-10.7-24-24-24H232V120c0-13.3-10.7-24-24-24s-24 10.7-24 24v64H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h64v64z"/></svg>\n   </div>\n   </div>\n  <div id="wCard" class="winterCards">${t} <span id="counter-wCard">${e.length}</span>/3\n  <div id="wCardStorage"></div></div>\n  </div>`
        },
        createTooltip(t, a = -1) {
            if (this.isFastMode())
                return;
            const s = CARDS_DATA[t];
            if (null == $("hint1_card_" + t)) {
                const a = s.type == TREE || s.type == W_CARD ? `<div id="hint1_card_${t}" class="hint"></div>` : s.type == V_CARD ? `<div id="hint1_card_${t}" class="hint onTop"></div>\n                <div id="hint2_card_${t}" class="hint onBottom"></div>` : `<div id="hint1_card_${t}" class="hint onLeft"></div>\n                <div id="hint2_card_${t}" class="hint onRight"></div>`;
                e.place(a, "card_" + t)
            }
            if (s.type == TREE)
                this.addCustomTooltip("hint1_card_" + t, this.getCardHelpDiv(t, TREE, a));
            else if (s.type == W_CARD)
                this.addCustomTooltip("hint1_card_" + t, this.getCardHelpDiv(t, "", a));
            else if (s.type == V_CARD) {
                this.addCustomTooltip("hint1_card_" + t, this.getCardHelpDiv(t, "onTop", a));
                this.addCustomTooltip("hint2_card_" + t, this.getCardHelpDiv(t, "onBottom", a))
            } else {
                this.addCustomTooltip("hint1_card_" + t, this.getCardHelpDiv(t, "onLeft", a));
                this.addCustomTooltip("hint2_card_" + t, this.getCardHelpDiv(t, "onRight", a))
            }
        },
        smartDestroy(t) {
            debug("smartDestroy", t);
            delete this.tooltips["hint1_" + t];
            delete this.tooltips["hint2_" + t];
            e.destroy(t)
        },
        getCardHelpDiv(t, a = "", s = -1) {
            isNaN(t) || "" != a || (a = $("card_" + t).dataset.position);
            if (!a)
                return this.card_tpl(t, "superCard");
            const i = this.getIdCard(t, a, s);
            let r = "";
            if (e.hasClass("card_" + t, "hare") || e.hasClass("card_" + t, "toad") || e.hasClass("card_" + t, "available")) {
                let s = e.query("#card_" + t),
                    i = e.query("#" + s[0].parentElement.id + " .card[data-position=" + s[0].dataset.position + "][data-tree-id=" + s[0].dataset.treeId + "]").map(e => e.dataset.id);
                for (let e = 0; e < i.length; e++)
                    r += this.card_tpl(i[e], "superCard " + a)
            } else
                r = this.card_tpl(t, "superCard " + a);
            return `<div class="tooltip_container" style="--orientation: ${"onLeft" == a || "onRight" == a ? "row" : "column"};">${r}<div id="hint_${t}" class="hintText">\n  ${i}   \n  </div>\n  </div>`
        },
        getIdCard(e, t, a) {
            const s = "onBottom" == t || "onRight" == t ? 1 : 0,
                i = CARDS_DATA[e].species[s];
            if (!i)
                return "";
            const r = this.getDataFromSpecie(i),
                d = this.fsr('<div class="name"><strong>${title}</strong> ${species}</div>', {
                    title: _("Name:"),
                    species: r.name,
                    i18n: ["title", "species"]
                }),
                n = r.effect ? this.fsr('<div class="effect"><strong>${title}</strong> ${effect}</div>', {
                    title: _("Effect:"),
                    effect: r.effect,
                    i18n: ["title", "effect"]
                }) : "",
                o = r.bonus ? this.fsr('<div class="bonus"><strong>${title}</strong> ${bonus}</div>', {
                    title: _("Bonus:"),
                    bonus: r.bonus,
                    i18n: ["title", "bonus"]
                }) : "";
            let c = {
                log: [],
                args: {
                    i18n: []
                }
            },
                l = 1;
            r.tags.forEach(e => {
                c.log.push("${tag" + l + "}");
                c.args["tag" + l] = _(e);
                c.args.i18n.push("tag" + l);
                l++
            });
            c.log = c.log.join(", ");
            const h = r.tags ? this.fsr('<div class="bonus"><strong>${title}</strong> ${bonus}</div>', {
                title: _("Tag(s):"),
                bonus: c,
                i18n: ["title", "bonus"]
            }) : "",
                u = this.fsr('<div class="occurence"><strong>${title}</strong> ${occurence}</div>', {
                    title: _("Occurences:"),
                    occurence: r.nb,
                    i18n: ["title", "occurence"]
                }),
                g = r.points ? this.fsr('<div class="scoring"><strong>${title}</strong> ${score}</div>', {
                    title: _("Scoring:"),
                    score: r.points,
                    i18n: ["title", "score"]
                }) : "";
            let p = WITH_OTHERS.includes(i) ? this.format_string_recursive(_("Your set of ${name} cards provides you ${nb} point(s)."), {
                nb: `<span id="scoreHint_${e}">${a}</span>`,
                name: r.tags.includes(BUTTERFLY) ? _("Butterfly") : r.name,
                i18n: ["name"]
            }) : SLOT_SCORE.includes(i) ? this.format_string_recursive(_("Each card on this slot provides you ${nb} point(s)."), {
                nb: `<span class="scoreHint_${e}">${a}</span>`
            }) : this.format_string_recursive(_("This card provides you ${nb} point(s)."), {
                nb: `<span class="scoreHint_${e}">${a}</span>`
            });
            p = a >= 0 ? `<br><div class="hinttext">${p}</div>` : "";
            return `\n  <div class="idCard">\n  ${d}\n  ${h}\n  ${u}\n  ${n}\n  ${o}\n  ${g}\n  ${p}\n  </div>\n  `
        },
        tplPlayerPanel: e => `<div id='fos-player-infos_${e.id}' class='player-infos'>\n  <div class='cards-counter counter' id='card-counter-${e.id}'>0</div>\n  <div class='cave-counter counter' id='cave-counter-${e.id}'>0</div>\n</div>`,
        myUpdatePlayerOrdering(t, a) {
            if (!t)
                return;
            let s = 0;
            for (let t in this.gamedatas.playerorder) {
                const a = this.gamedatas.playerorder[t];
                e.place("FOStable_" + a, "tables", s);
                s++
            }
        },
        addCounterOnDeck(t, a, s = !0) {
            const i = t + "_deckinfo",
                r = `<div id="${i}" class="deckinfo">0</div>`;
            e.place(r, t);
            const d = this.createCounter(i, a);
            a || !s ? $(t).classList.remove("empty") : $(t).classList.add("empty");
            return d
        },
        addImageActionButton(t, a, s, i = null, r = "blue") {
            i ? i.push("shadow bgaimagebutton") : i = ["shadow bgaimagebutton"];
            this.addActionButton(t, "", a, "customActions", !1, r);
            e.style(t, "border", "none");
            e.addClass(t, i.join(" "));
            e.removeClass(t, "bgabutton_blue");
            s && e.attr(t, "title", s);
            return $(t)
        },
        getTokenDiv(e, t) {
            var a = t[e];
            switch (e) {
                case "minicard":
                    if (t.position && t.position != TREE) {
                        const e = CARDS_DATA[t.cardId];
                        return `<br><div data-id="${t.cardId}" class="card logCard ${t.position} ${e.deck} ${t.cardType}"></div>`
                    }
                    if (t.cardId) {
                        const e = CARDS_DATA[t.cardId];
                        return `<br><div data-id="${t.cardId}" class="card logCard ${e.deck} ${t.cardType}"></div>`
                    }
                    return a;
                case "minicards":
                    return "<div class='logCards'>" + t.cards.map(e => `<div data-id="${e}" class="card logCard ${CARDS_DATA[e].type}"></div>`).join("<br>") + "</div>"
            }
        },
        genericMove(e, t, a = !1, s = null, i = null) {
            const r = $(e),
                d = $(t);
            if (this.isFastMode() || a && this.isCurrentPlayerActive()) {
                "first" == s ? d.prepend(r) : d.appendChild(r);
                r.classList.add("ready");
                i && i(r);
                return
            }
            const n = r.getBoundingClientRect();
            "first" == s ? d.prepend(r) : d.appendChild(r);
            const o = r.getBoundingClientRect(),
                c = n.top - o.top,
                l = n.left - o.left,
                h = n.width / o.width;
            r.style.transform = `translate(${l}px, ${c}px) scale(${h}) `;
            setTimeout(function () {
                r.classList.add("animate-on-transforms");
                r.style.transform = ""
            }, 100);
            r.addEventListener("transitionend", () => {
                r.classList.remove("animate-on-transforms");
                i && i(r)
            })
        },
        showCard(t, a = !1, s) {
            if (!t)
                return;
            e.place("<div id='card-overlay'></div>", "ebd-body");
            this.genericMove(t, "card-overlay", !1);
            $("card-overlay").offsetHeight;
            $("card-overlay").classList.add("active");
            let i = () => {
                this.genericMove(t, s, !1);
                $("card-overlay").classList.remove("active");
                this.wait(500).then(() => {
                    $("card-overlay").remove()
                })
            };
            a ? this.wait(2e3).then(i) : $("card-overlay").addEventListener("click", i)
        },
        adaptWidth() {
            const e = $("page-content").getBoundingClientRect().width / 12,
                t = e * ($("zoom_value").value / 100),
                a = document.querySelector(":root");
            a.style.setProperty("--card-width", e + "px");
            a.style.setProperty("--card-in-hand-width", t + "px");
            a.style.setProperty("--card-on-table-width", t + "px")
        }
    })
});
