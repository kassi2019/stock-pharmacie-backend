"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aujourdhui = aujourdhui;
exports.versDate = versDate;
exports.ajouterJours = ajouterJours;
exports.formatDate = formatDate;
function aujourdhui() {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
function versDate(valeur) {
    const d = new Date(valeur);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function ajouterJours(date, jours) {
    return new Date(date.getTime() + jours * 86_400_000);
}
function formatDate(date) {
    return date.toISOString().slice(0, 10).split('-').reverse().join('/');
}
//# sourceMappingURL=dates.js.map