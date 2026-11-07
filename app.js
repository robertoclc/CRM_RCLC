// ==========================================
// CONTROLADOR DA INTERFACE (app.js)
// ==========================================

let prospects = loadProspectsData();
let currentView = 'kanban';
let currentTablePage = 1;
let currentPages = { 'Novo prospect': 1, 'Primeiro contato enviado': 1, 'Segundo contato enviado': 1, 'Em negociação': 1, 'Cliente conquistado': 1 };
const ITEMS_PER_PAGE = 10;

function saveData() {
    saveProspectsData(prospects);
}

function switchView(view) {
    currentView = view;
    const kanbanWrapper = document.getElementById('kanbanLayoutWrapper');
    const tableView = document.getElementById('tableContainer');
    const dashView = document.getElementById('dashboardContainer');
    
    const btnKanban = document.getElementById('btnKanbanView');
    const btnTable = document.getElementById('btnTableView');
    const btnDash = document.getElementById('btnDashboardView');

    if (kanbanWrapper) kanbanWrapper.classList.remove('active-flex');
    if (tableView) tableView.classList.remove('active-block');
    if (dashView) dashView.classList.remove('active-grid');

    if (btnKanban) btnKanban.className = "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600";
    if (btnTable) btnTable.className = "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600";
    if (btnDash) btnDash.className = "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600";

    if (view === 'kanban') {
        if (kanbanWrapper) kanbanWrapper.classList.add('active-flex');
        if (btnKanban) btnKanban.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm";
    } else if (view === 'table') {
        if (tableView) tableView.classList.add('active-block');
        if (btnTable) btnTable.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm";
    } else if (view === 'dashboard') {
        if (dashView) dashView.classList.add('active-grid');
        if (btnDash) btnDash.className = "px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm";
    }
    
    renderApp();
}

function renderApp() {
    const searchInput = document.getElementById('searchInput');
    const originFilter = document.getElementById('originFilter');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const originVal = originFilter ? originFilter.value : '';
    
    const filtered = prospects.filter(p => {
        const matchSearch = (p.name && p.name.toLowerCase().includes(search)) || 
                            (p.company && p.company.toLowerCase().includes(search)) || 
                            (p.phone && p.phone.includes(search));
        const matchOrigin = !originVal || p.origin === originVal;
        return matchSearch && matchOrigin;
    });

    const metricTotal = document.getElementById('metricTotal');
    const metricNegociacao = document.getElementById('metricNegociacao');
    const metricGanhos = document.getElementById('metricGanhos');
    const metricTaxa = document.getElementById('metricTaxa');

    const totalCount = prospects.length;
    const negociacaoCount = prospects.filter(p => p.status === 'Em negociação').length;
    const conquistadosCount = prospects.filter(p => p.status === 'Cliente conquistado').length;
    const taxaConv = totalCount > 0 ? ((conquistadosCount / totalCount) * 100).toFixed(0) : 0;

    if (metricTotal) metricTotal.innerText = totalCount;
    if (metricNegociacao) metricNegociacao.innerText = negociacaoCount;
    if (metricGanhos) metricGanhos.innerText = conquistadosCount;
    if (metricTaxa) metricTaxa.innerText = taxaConv + '%';

    const statSemContato = document.getElementById('statSemContato');
    const statSemInteresse = document.getElementById('statSemInteresse');
    const countSemContato = filtered.filter(p => p.status === 'Sem contato').length;
    const countSemInteresse = filtered.filter(p => p.status === 'Sem interesse').length;
    
    if (statSemContato) statSemContato.innerText = countSemContato;
    if (statSemInteresse) statSemInteresse.innerText = countSemInteresse;

    const funnelBars = document.getElementById('funnelBars');
    if (funnelBars && currentView === 'dashboard') {
        const total = filtered.length || 1;
        const allDashboardStatuses = {
            ...STATUS_CONFIG,
            'Sem interesse': { title: 'Sem Interesse' },
            'Sem contato': { title: 'Sem Contato' }
        };

        funnelBars.innerHTML = Object.entries(allDashboardStatuses).map(([statusKey, config]) => {
            const count = filtered.filter(p => p.status === statusKey).length;
            const pct = ((count / total) * 100).toFixed(1);
            return `
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-semibold text-slate-600">
                    <span>${config.title}</span>
                    <span>${count} (${pct}%)</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div class="h-full bg-sky-500 rounded-full" style="width: ${pct}%;"></div>
                  </div>
                </div>
            `;
        }).join('');
    }

    const segmentBars = document.getElementById('segmentBars');
    if (segmentBars && currentView === 'dashboard') {
        const segmentCounts = {};
        filtered.forEach(p => {
            const seg = (p.company || 'Geral').trim();
            segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
        });
        const sortedSegments = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const total = filtered.length || 1;

        segmentBars.innerHTML = sortedSegments.map(([seg, count]) => {
            const pct = ((count / total) * 100).toFixed(1);
            return `
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-semibold text-slate-600">
                    <span>🏷️ ${escapeHtml(seg)}</span>
                    <span>${count} (${pct}%)</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: ${pct}%;"></div>
                  </div>
                </div>
            `;
        }).join('') || '<div class="text-xs text-slate-400">Sem dados de segmentos.</div>';
    }

    if (currentView === 'kanban') {
        renderKanban(filtered);
    } else if (currentView === 'table') {
        renderTable(filtered);
    }
}

function renderKanban(data) {
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;
    kanbanContainer.innerHTML = '';

    for (const [statusKey, config] of Object.entries(STATUS_CONFIG)) {
        const statusList = data.filter(p => p.status === statusKey);
        const totalItems = statusList.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

        if (!currentPages[statusKey] || currentPages[statusKey] > totalPages) {
            currentPages[statusKey] = 1;
        }

        const start = (currentPages[statusKey] - 1) * ITEMS_PER_PAGE;
        const paginatedList = statusList.slice(start, start + ITEMS_PER_PAGE);

        let cardsHtml = '';
        if (paginatedList.length === 0) {
            cardsHtml = `<div class="text-center text-slate-400 text-xs py-4">Nenhum prospect</div>`;
        } else {
            paginatedList.forEach(p => {
                const valNum = Number(p.value || 0);
                const valFormatted = 'R$ ' + valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                
                const phoneClean = p.phone ? String(p.phone).replace(/\D/g, '') : '';
                const finalWhatsUrl = p.whatsappLink ? p.whatsappLink : (phoneClean ? `https://wa.me/55${phoneClean}` : '');

                cardsHtml += `
                    <div onclick="editLead(${p.id})" class="bg-white p-3 rounded-lg border border-slate-200 cursor-pointer shadow-sm hover:shadow transition">
                        <div class="flex justify-between items-start gap-2 mb-1">
                            <div class="font-extrabold text-xs text-slate-900 leading-snug">${escapeHtml(p.name)}</div>
                            <div class="flex gap-1" onclick="event.stopPropagation()">
                                <button onclick="editLead(${p.id})" class="text-slate-400 hover:text-blue-600 text-xs"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="deleteProspect(${p.id})" class="text-slate-400 hover:text-rose-600 text-xs"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="text-[10px] font-medium text-slate-500 mb-2 flex items-center gap-1">🏷️ ${escapeHtml(p.company || 'Geral')}</div>
                        <div class="flex justify-between items-center border-t border-slate-100 pt-2 text-[11px]">
                            ${finalWhatsUrl ? `<a href="${finalWhatsUrl}" target="_blank" onclick="event.stopPropagation()" class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold hover:bg-emerald-100"><i class="fa-brands fa-whatsapp"></i> Whats</a>` : '<span class="text-slate-300 text-[10px]">Sem tel</span>'}
                            <span class="font-bold text-emerald-600">${valFormatted}</span>
                        </div>
                    </div>
                `;
            });
        }

        let columnHTML = `
            <div class="kanban-column bg-slate-100 rounded-xl p-3 flex flex-col border border-slate-200 h-[calc(100vh-240px)]">
                <div class="flex justify-between items-center mb-3 px-1">
                    <span class="text-[11px] font-extrabold text-slate-600 uppercase">${config.title}</span>
                    <span class="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-[10px] font-bold">${totalItems}</span>
                </div>
                <div class="flex-1 overflow-y-auto space-y-2 pr-1">
                    ${cardsHtml}
                </div>
        `;

        if (totalPages > 1) {
            columnHTML += `
                <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                    <button onclick="changeKanbanPage('${statusKey}', -1)" ${currentPages[statusKey] === 1 ? 'disabled class="text-slate-300 cursor-not-allowed"' : 'class="text-blue-600 font-semibold cursor-pointer"'}>Anterior</button>
                    <span class="text-slate-500">${currentPages[statusKey]} / ${totalPages}</span>
                    <button onclick="changeKanbanPage('${statusKey}', 1)" ${currentPages[statusKey] === totalPages ? 'disabled class="text-slate-300 cursor-not-allowed"' : 'class="text-blue-600 font-semibold cursor-pointer"'}>Próxima</button>
                </div>
            `;
        }

        columnHTML += `</div>`;
        kanbanContainer.innerHTML += columnHTML;
    }
}

function renderTable(data) {
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) return;
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (currentTablePage > totalPages) currentTablePage = totalPages;

    const start = (currentTablePage - 1) * ITEMS_PER_PAGE;
    const paginatedData = data.slice(start, start + ITEMS_PER_PAGE);

    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">Nenhum prospect encontrado</td></tr>`;
    } else {
        paginatedData.forEach(p => {
            const allLabels = {
                ...STATUS_CONFIG,
                'Sem interesse': { title: 'Sem Interesse' },
                'Sem contato': { title: 'Sem Contato' }
            };
            let statusLabel = allLabels[p.status] ? allLabels[p.status].title : p.status;
            const valNum = Number(p.value || 0);
            const valFormatted = 'R$ ' + valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            
            const phoneClean = p.phone ? String(p.phone).replace(/\D/g, '') : '';
            const finalWhatsUrl = p.whatsappLink ? p.whatsappLink : (phoneClean ? `https://wa.me/55${phoneClean}` : '');

            tableBody.innerHTML += `
                <tr onclick="editLead(${p.id})" class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <td class="p-3">
                        <div class="font-extrabold text-slate-900 text-xs">${escapeHtml(p.name)}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">🏷️ ${escapeHtml(p.company || 'Geral')}</div>
                    </td>
                    <td class="p-3 text-xs text-slate-600">${escapeHtml(p.origin || 'Google Maps')}</td>
                    <td class="p-3 text-xs">${finalWhatsUrl ? `<a href="${finalWhatsUrl}" target="_blank" onclick="event.stopPropagation()" class="text-emerald-600 font-bold hover:underline">${escapeHtml(p.phone || 'Abrir WhatsApp')}</a>` : '-'}</td>
                    <td class="p-3"><span class="bg-slate-100 px-2 py-1 rounded text-[11px] font-semibold text-slate-700">${statusLabel}</span></td>
                    <td class="p-3 font-bold text-emerald-600 text-xs">${valFormatted}</td>
                    <td class="p-3 text-right" onclick="event.stopPropagation()">
                        <button onclick="editLead(${p.id})" class="text-blue-600 hover:text-blue-800 text-xs mr-2"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteProspect(${p.id})" class="text-rose-500 hover:text-rose-700 text-xs"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    let paginationDiv = document.getElementById('tablePagination');
    if (!paginationDiv) {
        paginationDiv = document.createElement('div');
        paginationDiv.id = 'tablePagination';
        paginationDiv.className = "p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs";
        tableContainer.appendChild(paginationDiv);
    }

    if (totalPages > 1) {
        paginationDiv.style.display = 'flex';
        paginationDiv.innerHTML = `
            <button onclick="changeTablePage(-1)" ${currentTablePage === 1 ? 'disabled class="text-slate-300 cursor-not-allowed font-semibold"' : 'class="text-blue-600 font-semibold cursor-pointer"'}>Anterior</button>
            <span class="text-slate-500">Página ${currentTablePage} de ${totalPages} (${totalItems} registos)</span>
            <button onclick="changeTablePage(1)" ${currentTablePage === totalPages ? 'disabled class="text-slate-300 cursor-not-allowed font-semibold"' : 'class="text-blue-600 font-semibold cursor-pointer"'}>Próxima</button>
        `;
    } else {
        paginationDiv.style.display = 'none';
    }
}

function changeKanbanPage(statusKey, direction) {
    currentPages[statusKey] += direction;
    renderApp();
}

function changeTablePage(direction) {
    currentTablePage += direction;
    renderApp();
}

function openModal() {
    const modalTitle = document.getElementById('modalTitle');
    const leadForm = document.getElementById('leadForm');
    const leadId = document.getElementById('leadId');
    const deleteBtn = document.getElementById('deleteBtn');
    const leadModal = document.getElementById('leadModal');

    if (modalTitle) modalTitle.innerText = 'Novo Prospect';
    if (leadForm) leadForm.reset();
    if (leadId) leadId.value = '';
    if (deleteBtn) deleteBtn.classList.add('hidden');
    if (leadModal) leadModal.classList.remove('hidden');
}

function closeModal() {
    const leadModal = document.getElementById('leadModal');
    if (leadModal) leadModal.classList.add('hidden');
}

function editLead(id) {
    const p = prospects.find(item => item.id === id);
    if (!p) return;

    const modalTitle = document.getElementById('modalTitle');
    const leadId = document.getElementById('leadId');
    const companyName = document.getElementById('companyName');
    const contactName = document.getElementById('contactName');
    const phone = document.getElementById('phone');
    const statusSelect = document.getElementById('statusSelect');
    const originSelect = document.getElementById('originSelect');
    const valueInput = document.getElementById('valueInput');
    const notesInput = document.getElementById('notesInput');
    const deleteBtn = document.getElementById('deleteBtn');
    const leadModal = document.getElementById('leadModal');

    if (modalTitle) modalTitle.innerText = 'Editar Prospect';
    if (leadId) leadId.value = p.id;
    if (companyName) companyName.value = p.name || '';
    if (contactName) contactName.value = p.company || '';
    if (phone) phone.value = p.phone || '';
    if (statusSelect) statusSelect.value = p.status || 'Novo prospect';
    if (originSelect) originSelect.value = p.origin || 'Google Maps';
    if (valueInput) valueInput.value = p.value || 0;
    if (notesInput) notesInput.value = p.notes || '';
    if (deleteBtn) deleteBtn.classList.remove('hidden');
    if (leadModal) leadModal.classList.remove('hidden');
}

function saveProspect(event) {
    event.preventDefault();
    const id = document.getElementById('leadId').value;
    
    const companyName = document.getElementById('companyName');
    const contactName = document.getElementById('contactName');
    const phone = document.getElementById('phone');
    const statusSelect = document.getElementById('statusSelect');
    const originSelect = document.getElementById('originSelect');
    const valueInput = document.getElementById('valueInput');
    const notesInput = document.getElementById('notesInput');

    const data = {
        id: id ? Number(id) : Date.now(),
        name: companyName ? companyName.value : 'Empresa Sem Nome',
        company: contactName ? contactName.value : 'Geral',
        phone: phone ? phone.value : '',
        whatsappLink: '',
        origin: originSelect ? originSelect.value : 'Google Maps',
        value: valueInput ? parseFloat(valueInput.value) || 0 : 0,
        status: statusSelect ? statusSelect.value : 'Novo prospect',
        lastContact: new Date().toLocaleDateString('pt-BR'),
        notes: notesInput ? notesInput.value : ''
    };

    if (id) {
        const index = prospects.findIndex(item => item.id === Number(id));
        if (index !== -1) prospects[index] = data;
    } else {
        prospects.push(data);
    }

    saveData();
    closeModal();
    renderApp();
}

function deleteProspect(id) {
    if (confirm('Tem certeza que deseja excluir este prospect?')) {
        prospects = prospects.filter(item => item.id !== id);
        saveData();
        renderApp();
    }
}

function handleImportExcel(e) {
    importExcel(e, (data) => {
        prospects = data;
        saveData();
        renderApp();
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, "&amp;").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

renderApp();