// ==========================================
// SCRIPT PRINCIPAL DE ORQUESTRAÇÃO (script.js)
// ==========================================

function importCSV(event) {
    handleImportExcel(event);
}

function exportCSV() {
    handleExportExcel();
}

function deleteCurrentLead() {
    const id = document.getElementById('leadId').value;
    if (id) {
        deleteProspect(Number(id));
        closeModal();
    }
}

function saveLead(event) {
    saveProspect(event);
}

function clearAllData() {
    if (confirm("Deseja apagar todos os dados do CRM?")) {
        prospects = [];
        saveData();
        renderApp();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderApp === 'function') {
        renderApp();
    }
});