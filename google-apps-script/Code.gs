// ============================================
// GO ON FORÇA MANAGER - GOOGLE APPS SCRIPT API
// ============================================
// Cole este código no Apps Script da sua planilha
// (Extensões > Apps Script)
// Depois faça Deploy > Implantar como aplicativo da web
// ============================================

const SPREADSHEET_ID = '1fSV6vbOiE1GUIbC0YHAI4tDnuL0eHOFI8ZU4l_GyBDk';

// Nomes das abas
const SHEETS = {
  ATLETAS: 'Atletas',
  TREINADORES: 'Treinadores',
  HANDOFF_NOTES: 'HandoffNotes',
  LOG_CONVERSAS: 'LogConversas'
};

// Headers para cada aba
const HEADERS = {
  ATLETAS: [
    'id', 'nome', 'telefone', 'professor_id', 'treinador_corrida_id', 'plano', 'ambiente', 'dias_treina',
    'bloco_mfit', 'pronto_ate', 'status', 'prova_alvo', 'data_prova',
    'lesoes_ativas', 'limitacoes', 'perfil_comportamento', 'objetivos',
    'nivel_experiencia', 'equipamentos', 'notas_treinador', 'observacao',
    'created_at', 'updated_at'
  ],
  TREINADORES: ['id', 'nome', 'email', 'created_at'],
  HANDOFF_NOTES: ['id', 'atleta_id', 'treinador_id', 'conteudo', 'created_at'],
  LOG_CONVERSAS: ['id', 'atleta_id', 'treinador_id', 'created_at']
};

// ============================================
// CONFIGURAÇÃO INICIAL
// ============================================

function setupHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  Object.keys(SHEETS).forEach(key => {
    const sheet = ss.getSheetByName(SHEETS[key]);
    if (sheet) {
      const headers = HEADERS[key];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });

  return { success: true, message: 'Headers configurados com sucesso!' };
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function generateUUID() {
  return Utilities.getUuid();
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function getDataAsObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      // Converter datas para ISO string
      if (value instanceof Date) {
        value = value.toISOString();
      }
      obj[header] = value;
    });
    return obj;
  }).filter(obj => obj.id); // Filtrar linhas vazias
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return i + 1; // +1 porque arrays começam em 0 mas linhas em 1
    }
  }
  return -1;
}

function objectToRow(obj, headers) {
  return headers.map(header => obj[header] || '');
}

// ============================================
// CORS E RESPOSTA
// ============================================

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// HANDLERS HTTP
// ============================================

function doGet(e) {
  const action = e.parameter.action;

  try {
    switch (action) {
      case 'getAtletas':
        return createResponse({ success: true, data: getDataAsObjects(SHEETS.ATLETAS) });

      case 'getTreinadores':
        return createResponse({ success: true, data: getDataAsObjects(SHEETS.TREINADORES) });

      case 'getHandoffNotes':
        const atletaId = e.parameter.atleta_id;
        let notes = getDataAsObjects(SHEETS.HANDOFF_NOTES);
        if (atletaId) {
          notes = notes.filter(n => n.atleta_id === atletaId);
        }
        return createResponse({ success: true, data: notes });

      case 'getLogConversas':
        const atletaIdLog = e.parameter.atleta_id;
        let logs = getDataAsObjects(SHEETS.LOG_CONVERSAS);
        if (atletaIdLog) {
          logs = logs.filter(l => l.atleta_id === atletaIdLog);
        }
        return createResponse({ success: true, data: logs });

      case 'getAtleta':
        const id = e.parameter.id;
        const atletas = getDataAsObjects(SHEETS.ATLETAS);
        const atleta = atletas.find(a => a.id === id);
        return createResponse({ success: true, data: atleta || null });

      case 'getDashboardStats':
        return createResponse({ success: true, data: calculateDashboardStats() });

      case 'setup':
        return createResponse(setupHeaders());

      default:
        return createResponse({ success: false, error: 'Ação não reconhecida' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case 'createAtleta':
        return createResponse(createAtleta(payload.data));

      case 'updateAtleta':
        return createResponse(updateAtleta(payload.id, payload.data));

      case 'deleteAtleta':
        return createResponse(deleteAtleta(payload.id));

      case 'createTreinador':
        return createResponse(createTreinador(payload.data));

      case 'updateTreinador':
        return createResponse(updateTreinador(payload.id, payload.data));

      case 'deleteTreinador':
        return createResponse(deleteTreinador(payload.id));

      case 'createHandoffNote':
        return createResponse(createHandoffNote(payload.data));

      case 'createLogConversa':
        return createResponse(createLogConversa(payload.data));

      default:
        return createResponse({ success: false, error: 'Ação não reconhecida' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// CRUD ATLETAS
// ============================================

function createAtleta(data) {
  const sheet = getSheet(SHEETS.ATLETAS);
  const now = new Date().toISOString();

  const atleta = {
    id: generateUUID(),
    nome: data.nome || '',
    telefone: data.telefone || '',
    professor_id: data.professor_id || '',
    treinador_corrida_id: data.treinador_corrida_id || '',
    plano: data.plano || 'PRO',
    ambiente: data.ambiente || 'Academia',
    dias_treina: data.dias_treina || 3,
    bloco_mfit: data.bloco_mfit || '',
    pronto_ate: data.pronto_ate || '',
    status: data.status || 'aguardando_treino',
    prova_alvo: data.prova_alvo || '',
    data_prova: data.data_prova || '',
    lesoes_ativas: data.lesoes_ativas || '',
    limitacoes: data.limitacoes || '',
    perfil_comportamento: data.perfil_comportamento || '',
    objetivos: data.objetivos || '',
    nivel_experiencia: data.nivel_experiencia || 'intermediario',
    equipamentos: data.equipamentos || '',
    notas_treinador: data.notas_treinador || '',
    observacao: data.observacao || '',
    created_at: now,
    updated_at: now
  };

  const row = objectToRow(atleta, HEADERS.ATLETAS);
  sheet.appendRow(row);

  return { success: true, data: atleta };
}

function updateAtleta(id, data) {
  const sheet = getSheet(SHEETS.ATLETAS);
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return { success: false, error: 'Atleta não encontrado' };
  }

  const headers = HEADERS.ATLETAS;
  const currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

  // Criar objeto com dados atuais
  const currentData = {};
  headers.forEach((h, i) => currentData[h] = currentRow[i]);

  // Mesclar com novos dados
  const updatedData = { ...currentData, ...data, updated_at: new Date().toISOString() };
  updatedData.id = id; // Garantir que o ID não mude

  const newRow = objectToRow(updatedData, headers);
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);

  return { success: true, data: updatedData };
}

function deleteAtleta(id) {
  const sheet = getSheet(SHEETS.ATLETAS);
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return { success: false, error: 'Atleta não encontrado' };
  }

  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ============================================
// CRUD TREINADORES
// ============================================

function createTreinador(data) {
  const sheet = getSheet(SHEETS.TREINADORES);
  const now = new Date().toISOString();

  const treinador = {
    id: generateUUID(),
    nome: data.nome || '',
    email: data.email || '',
    created_at: now
  };

  const row = objectToRow(treinador, HEADERS.TREINADORES);
  sheet.appendRow(row);

  return { success: true, data: treinador };
}

function updateTreinador(id, data) {
  const sheet = getSheet(SHEETS.TREINADORES);
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return { success: false, error: 'Treinador não encontrado' };
  }

  const headers = HEADERS.TREINADORES;
  const currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

  const currentData = {};
  headers.forEach((h, i) => currentData[h] = currentRow[i]);

  const updatedData = { ...currentData, ...data };
  updatedData.id = id;

  const newRow = objectToRow(updatedData, headers);
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);

  return { success: true, data: updatedData };
}

function deleteTreinador(id) {
  const sheet = getSheet(SHEETS.TREINADORES);
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    return { success: false, error: 'Treinador não encontrado' };
  }

  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ============================================
// HANDOFF NOTES
// ============================================

function createHandoffNote(data) {
  const sheet = getSheet(SHEETS.HANDOFF_NOTES);
  const now = new Date().toISOString();

  const note = {
    id: generateUUID(),
    atleta_id: data.atleta_id || '',
    treinador_id: data.treinador_id || '',
    conteudo: data.conteudo || '',
    created_at: now
  };

  const row = objectToRow(note, HEADERS.HANDOFF_NOTES);
  sheet.appendRow(row);

  return { success: true, data: note };
}

// ============================================
// LOG DE CONVERSAS
// ============================================

function createLogConversa(data) {
  const sheet = getSheet(SHEETS.LOG_CONVERSAS);
  const now = new Date().toISOString();

  const log = {
    id: generateUUID(),
    atleta_id: data.atleta_id || '',
    treinador_id: data.treinador_id || '',
    created_at: now
  };

  const row = objectToRow(log, HEADERS.LOG_CONVERSAS);
  sheet.appendRow(row);

  return { success: true, data: log };
}

// ============================================
// AUTO-GENERATE IDs (para adição direta na planilha)
// ============================================

// Execute esta função uma vez para configurar o trigger
function setupOnEditTrigger() {
  // Remove triggers existentes para evitar duplicatas
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditAutoId') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Cria novo trigger
  ScriptApp.newTrigger('onEditAutoId')
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();

  return { success: true, message: 'Trigger configurado! IDs serão gerados automaticamente.' };
}

// Função chamada automaticamente quando a planilha é editada
function onEditAutoId(e) {
  if (!e) return;

  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  // Verificar se é uma das abas que precisam de ID
  const validSheets = [SHEETS.ATLETAS, SHEETS.TREINADORES, SHEETS.HANDOFF_NOTES, SHEETS.LOG_CONVERSAS];
  if (!validSheets.includes(sheetName)) return;

  const range = e.range;
  const row = range.getRow();

  // Ignorar header
  if (row === 1) return;

  // Verificar se a coluna A (ID) está vazia
  const idCell = sheet.getRange(row, 1);
  const currentId = idCell.getValue();

  // Se não tem ID e a linha tem algum conteúdo, gerar ID
  if (!currentId) {
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    const hasContent = rowData.some((cell, index) => index > 0 && cell !== '');

    if (hasContent) {
      const newId = generateUUID();
      idCell.setValue(newId);

      // Se for Atletas, também preencher created_at e updated_at se vazios
      if (sheetName === SHEETS.ATLETAS) {
        const headers = HEADERS.ATLETAS;
        const createdAtIndex = headers.indexOf('created_at') + 1;
        const updatedAtIndex = headers.indexOf('updated_at') + 1;
        const now = new Date().toISOString();

        if (!sheet.getRange(row, createdAtIndex).getValue()) {
          sheet.getRange(row, createdAtIndex).setValue(now);
        }
        if (!sheet.getRange(row, updatedAtIndex).getValue()) {
          sheet.getRange(row, updatedAtIndex).setValue(now);
        }
      }

      // Para outras abas, preencher created_at
      if ([SHEETS.TREINADORES, SHEETS.HANDOFF_NOTES, SHEETS.LOG_CONVERSAS].includes(sheetName)) {
        const headers = HEADERS[Object.keys(SHEETS).find(k => SHEETS[k] === sheetName)];
        const createdAtIndex = headers.indexOf('created_at') + 1;
        const now = new Date().toISOString();

        if (!sheet.getRange(row, createdAtIndex).getValue()) {
          sheet.getRange(row, createdAtIndex).setValue(now);
        }
      }
    }
  }
}

// Função para gerar IDs para todas as linhas existentes sem ID
function generateMissingIds() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let count = 0;

  Object.keys(SHEETS).forEach(key => {
    const sheetName = SHEETS[key];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const headers = HEADERS[key];
    const now = new Date().toISOString();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const hasContent = row.some((cell, index) => index > 0 && cell !== '');

      if (hasContent && !row[0]) {
        // Gerar ID
        sheet.getRange(i + 1, 1).setValue(generateUUID());
        count++;

        // Preencher timestamps se necessário
        const createdAtIndex = headers.indexOf('created_at');
        const updatedAtIndex = headers.indexOf('updated_at');

        if (createdAtIndex > -1 && !row[createdAtIndex]) {
          sheet.getRange(i + 1, createdAtIndex + 1).setValue(now);
        }
        if (updatedAtIndex > -1 && !row[updatedAtIndex]) {
          sheet.getRange(i + 1, updatedAtIndex + 1).setValue(now);
        }
      }
    }
  });

  return { success: true, message: `${count} IDs gerados com sucesso!` };
}

// ============================================
// DASHBOARD STATS
// ============================================

function calculateDashboardStats() {
  const atletas = getDataAsObjects(SHEETS.ATLETAS);
  const logs = getDataAsObjects(SHEETS.LOG_CONVERSAS);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const umaSemanaAtras = new Date(hoje);
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

  // Calcular dias para cada atleta
  const atletasComDias = atletas.map(a => {
    const prontoAte = a.pronto_ate ? new Date(a.pronto_ate) : null;
    let dias = null;
    if (prontoAte) {
      dias = Math.ceil((prontoAte - hoje) / (1000 * 60 * 60 * 24));
    }

    // Verificar se conversou essa semana
    const conversouSemana = logs.some(l => {
      if (l.atleta_id !== a.id) return false;
      const dataLog = new Date(l.created_at);
      return dataLog >= umaSemanaAtras;
    });

    return { ...a, dias, conversouSemana };
  });

  return {
    para_montar_semana: atletasComDias.filter(a =>
      a.dias !== null && a.dias >= 0 && a.dias <= 7 && a.status !== 'treino_montado'
    ).length,

    ja_com_treino: atletasComDias.filter(a =>
      a.status === 'treino_montado' && a.dias !== null && a.dias >= 0
    ).length,

    fecham_proxima_semana: atletasComDias.filter(a =>
      a.dias !== null && a.dias >= 8 && a.dias <= 14
    ).length,

    sem_treinador: atletasComDias.filter(a => !a.professor_id).length,

    atrasados: atletasComDias.filter(a =>
      a.dias !== null && a.dias < 0
    ).length,

    precisam_ajuste: atletasComDias.filter(a =>
      a.status === 'precisa_ajuste'
    ).length,

    sem_conversa_semana: atletasComDias.filter(a => !a.conversouSemana).length
  };
}
