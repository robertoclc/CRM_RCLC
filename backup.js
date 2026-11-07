// ==========================================
// MÓDULO DE BACKUP E PERSISTÊNCIA (backup.js)
// ==========================================

function loadProspectsData() {
    return JSON.parse(localStorage.getItem('prospects')) || 
           JSON.parse(localStorage.getItem('rclc_crm_prospects')) || [
        { id: 1, name: 'Padaria Pão Dourado', company: 'Carlos Silva', phone: '(21) 98888-1111', whatsappLink: 'https://wa.me/5521988881111', value: 1200.00, status: 'Novo prospect', lastContact: '01/11/2026', notes: 'Interesse em Google Meu Negócio' },
        { id: 2, name: 'Modas & Estilo', company: 'Ana Souza', phone: '(21) 97777-2222', whatsappLink: 'https://wa.me/5521977772222', value: 850.00, status: 'Primeiro contato enviado', lastContact: '03/11/2026', notes: 'Enviada apresentação comercial' },
        { id: 3, name: 'Oficina Mecânica RPM', company: 'Marcos Oliveira', phone: '(21) 96666-3333', whatsappLink: 'https://wa.me/5521966663333', value: 1500.00, status: 'Em negociação', lastContact: '05/11/2026', notes: 'Fechando contrato do site' }
    ];
}

function saveProspectsData(prospectsArray) {
    localStorage.setItem('rclc_crm_prospects', JSON.stringify(prospectsArray));
    localStorage.setItem('prospects', JSON.stringify(prospectsArray));
}

function formatarDataBR(dataBruta) {
    if (!dataBruta) return new Date().toLocaleDateString('pt-BR');
    const str = String(dataBruta).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

    const d = new Date(dataBruta);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR');
    }
    return str;
}

function importExcel(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const statusBox = document.getElementById('importStatus');
    const statusText = document.getElementById('importStatusText');
    const statusCount = document.getElementById('importCount');

    if (statusBox) statusBox.classList.remove('hidden');
    if (statusText) statusText.innerText = "A processar ficheiro Excel...";
    if (statusCount) statusCount.innerText = "A ler colunas e a detetar links do WhatsApp...";

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array', cellText: true, cellDates: true});
            const firstSheet = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {raw: false, defval: ""});

            const validRows = rows.filter(r => {
                return Object.values(r).some(val => val !== undefined && val !== null && String(val).trim() !== "");
            });

            if (validRows.length > 0) {
                const mappedRows = validRows.map((r, index) => {
                    let empresa = '';
                    let telefone = '';
                    let whatsappLink = '';
                    let segmento = '';
                    let statusBruto = '';
                    let originVal = 'Google Maps';
                    let notesList = [];

                    const val1o = formatarDataBR(r['1o. Envio'] || r['1o envio'] || r['DT ENVIO'] || '');
                    const val2o = formatarDataBR(r['2o. ENVIO'] || r['2o env'] || '');
                    const valRetorno = formatarDataBR(r['Dt Retorno'] || r['dt retorno'] || r['Retorno'] || '');

                    if (String(val1o).trim() !== '' && String(val1o).trim() !== 'undefined') {
                        notesList.push(`1º Envio: ${val1o}`);
                    }
                    if (String(val2o).trim() !== '' && String(val2o).trim() !== 'undefined') {
                        notesList.push(`2º Envio: ${val2o}`);
                    }
                    if (String(valRetorno).trim() !== '' && String(valRetorno).trim() !== 'undefined') {
                        notesList.push(`Retorno: ${valRetorno}`);
                    }

                    for (let key in r) {
                        const kLower = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        const val = r[key];
                        if (val === undefined || val === null || val === '') continue;

                        const valStr = String(val).trim();

                        // Identifica com precisão a coluna de Link WhatsApp e a coluna de Telefone
                        if (kLower.includes('link whats') || kLower.includes('url whats') || kLower.includes('api whats')) {
                            whatsappLink = valStr;
                        } else if (kLower.includes('telef') || kLower.includes('tel') || kLower.includes('cel') || kLower.includes('whats') || kLower.includes('zap') || kLower.includes('numero')) {
                            telefone = valStr;
                        } else if (kLower.includes('empresa') || kLower.includes('nome')) {
                            empresa = valStr;
                        } else if (kLower.includes('segmento') || kLower.includes('contato')) {
                            segmento = valStr; 
                        } else if (kLower.includes('origem')) {
                            originVal = valStr;
                        } else if (kLower.includes('status') || kLower.includes('verificacao')) {
                            statusBruto = valStr;
                        } else {
                            if (!kLower.includes('envio') && !kLower.includes('retorno') && !kLower.includes('1o') && !kLower.includes('2o')) {
                                notesList.push(`${key}: ${valStr}`);
                            }
                        }
                    }

                    // Se a coluna de link não foi apanhada pelo nome mas existe algum URL na linha, recolhe
                    if (!whatsappLink) {
                        for (let key in r) {
                            const valStr = String(r[key]).trim();
                            if (valStr.includes('wa.me/') || valStr.includes('whatsapp.com')) {
                                whatsappLink = valStr;
                                break;
                            }
                        }
                    }

                    if (!empresa) empresa = 'Empresa Sem Nome';
                    if (!segmento) segmento = 'Geral';

                    let status = 'Novo prospect';
                    const sLower = statusBruto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                    if (sLower.includes('sem interesse')) {
                        status = 'Sem interesse';
                    } else if (sLower.includes('negociacao') || sLower.includes('respondeu')) {
                        status = 'Em negociação';
                    } else if (sLower.includes('segundo') || sLower.includes('2')) {
                        status = 'Segundo contato enviado';
                    } else if (sLower.includes('conquistado') || sLower.includes('cliente')) {
                        status = 'Cliente conquistado';
                    } else if (sLower.includes('sem contato')) {
                        status = 'Sem contato';
                    } else if (sLower.includes('primeiro') || sLower.includes('1')) {
                        status = 'Primeiro contato enviado';
                    } else {
                        status = statusBruto || 'Novo prospect';
                    }

                    const lastContact = valRetorno || val2o || val1o || new Date().toLocaleDateString('pt-BR');

                    return {
                        id: r.id || (Date.now() + index),
                        name: empresa,      
                        company: segmento,  
                        phone: telefone,
                        whatsappLink: whatsappLink,
                        origin: originVal,
                        value: parseFloat(r['Valor'] || r['valor'] || 0) || 0.00,
                        status: status,
                        lastContact: lastContact,
                        notes: notesList.join(' | ')
                    };
                });

                if (statusText) statusText.innerText = "Importação concluída com sucesso!";
                if (statusCount) statusCount.innerText = `${mappedRows.length} registos carregados com sucesso.`;
                
                setTimeout(() => {
                    if (statusBox) statusBox.classList.add('hidden');
                }, 3500);

                callback(mappedRows);
            } else {
                if (statusBox) statusBox.classList.add('hidden');
                alert("O ficheiro Excel parece estar vazio.");
            }
        } catch (err) {
            console.error("Erro ao importar Excel:", err);
            if (statusBox) statusBox.classList.add('hidden');
            alert("Erro ao ler o ficheiro Excel.");
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportJSON(prospectsArray) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prospectsArray, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_crm_rclc_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importJSON(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                callback(importedData);
            } else {
                alert('O ficheiro de backup não é válido.');
            }
        } catch (error) {
            alert('Erro ao ler o ficheiro JSON.');
        }
    };
}

function handleRestoreBackup(event) {
    importJSON(event, (importedData) => {
        if (confirm(`Deseja restaurar ${importedData.length} prospects do ficheiro de backup? Os dados atuais serão atualizados.`)) {
            prospects = importedData;
            saveData();
            renderApp();
            alert("Backup restaurado com sucesso!");
        }
    });
}