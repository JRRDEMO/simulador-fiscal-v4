// Datos de configuración fiscal
const FISCAL_PARAMS = {
    tributacion_general: 0.25,
    tributacion_zec: 0.04,
    ric_maximo: 0.90,
    dic_porcentaje: 0.90,
    idi: {
        general: 0.45,
        incremental_canarias: 0.90,
        bonificacion_personal_canarias: 0.306
    },
    audiovisual: {
        tramo1_porcentaje: 0.54,
        resto_porcentaje: 0.45,
        tramo1_limite: 1000000
    },
    limite_conjunto_deducciones: 0.60,
    zec_limite_base_minimo: 1800000,
    zec_limite_empleos_base: 50,
    zec_incremento_por_empleo: 50000
};

const SECTORES_ZEC = [
    "Servicios Tecnológicos",
    "I+D+i",
    "Audiovisual", 
    "Industria Manufacturera",
    "Servicios Financieros Internacionales",
    "Logística",
    "Energías Renovables",
    "Biotecnología"
];

const SECTORES_ESTRATEGICOS_DIC = [
    "TICs y Software",
    "Biotecnología",
    "Energías Renovables", 
    "Industria 4.0",
    "Economía Azul",
    "Turismo Tecnológico",
    "Servicios Avanzados"
];

const MODELOS_PROYECCION = {
    conservador: { label: "Conservador", factor: 0.8 },
    moderado: { label: "Moderado", factor: 1.0 },
    agresivo: { label: "Agresivo", factor: 1.2 }
};

// Clase principal de la aplicación
class SPEGCApp {
    constructor() {
        this.initialized = false;
        this.fiscalEngine = new FiscalEngine();
        this.stateManager = new StateManager();
        this.reasoningEngine = new ReasoningEngine();
        this.currentChart = null;
    }

    async init() {
        console.log('Iniciando aplicación SPEGC...');
        
        // Mostrar pantalla de carga
        this.showLoadingScreen();
        
        // Simular tiempo de carga
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ocultar pantalla de carga y mostrar disclaimer
        this.hideLoadingScreen();
        this.showDisclaimer();
        
        // Configurar eventos del disclaimer
        this.setupDisclaimerEvents();
        
        this.initialized = true;
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showDisclaimer() {
        const disclaimerModal = document.getElementById('disclaimerModal');
        if (disclaimerModal) {
            disclaimerModal.style.display = 'flex';
        }
    }

    hideDisclaimer() {
        const disclaimerModal = document.getElementById('disclaimerModal');
        if (disclaimerModal) {
            disclaimerModal.style.display = 'none';
        }
    }

    showMainApp() {
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.classList.add('fade-in');
        }
    }

    setupDisclaimerEvents() {
        const acceptTerms = document.getElementById('acceptTerms');
        const acceptBtn = document.getElementById('acceptDisclaimerBtn');

        if (acceptTerms && acceptBtn) {
            acceptTerms.addEventListener('change', (e) => {
                acceptBtn.disabled = !e.target.checked;
            });

            acceptBtn.addEventListener('click', () => {
                this.hideDisclaimer();
                this.showMainApp();
                this.setupMainApp();
            });
        }
    }

    setupMainApp() {
        console.log('Configurando aplicación principal...');
        
        // Configurar eventos del formulario
        this.setupFormEvents();
        
        // Configurar eventos de información
        this.setupInfoEvents();
        
        // Configurar eventos de escenarios
        this.setupScenarioEvents();
        
        // Configurar eventos de exportación
        this.setupExportEvents();
        
        // Configurar el range slider de RIC
        this.setupRangeSlider();
        
        console.log('Aplicación principal configurada');
    }

    setupFormEvents() {
        // Eventos de checkboxes para mostrar/ocultar campos
        const incentiveCheckboxes = [
            { checkbox: 'aplicarZEC', fields: 'zecFields' },
            { checkbox: 'aplicarRIC', fields: 'ricFields' },
            { checkbox: 'aplicarDIC', fields: 'dicFields' },
            { checkbox: 'aplicarIDI', fields: 'idiFields' },
            { checkbox: 'aplicarIT', fields: 'itFields' },
            { checkbox: 'aplicarAudiovisual', fields: 'audiovisualFields' }
        ];

        incentiveCheckboxes.forEach(({ checkbox, fields }) => {
            const checkboxEl = document.getElementById(checkbox);
            const fieldsEl = document.getElementById(fields);
            
            if (checkboxEl && fieldsEl) {
                checkboxEl.addEventListener('change', (e) => {
                    fieldsEl.style.display = e.target.checked ? 'block' : 'none';
                    this.calculateResults();
                });
            }
        });

        // Evento del botón calcular
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculateResults();
            });
        }

        // Eventos de cambio en los inputs para cálculo en tiempo real
        const formInputs = document.querySelectorAll('#fiscalForm input, #fiscalForm select');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculateResults();
            });
        });
    }

    setupRangeSlider() {
        const ricSlider = document.getElementById('dotacionRIC');
        const ricValue = document.getElementById('ricValue');
        
        if (ricSlider && ricValue) {
            ricSlider.addEventListener('input', (e) => {
                ricValue.textContent = e.target.value + '%';
                this.calculateResults();
            });
        }
    }

    setupInfoEvents() {
        const infoBtns = document.querySelectorAll('.info-btn');
        infoBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const infoType = e.target.getAttribute('data-info');
                this.showInfoModal(infoType);
            });
        });
    }

    setupScenarioEvents() {
        const newScenarioBtn = document.getElementById('newScenarioBtn');
        const scenarioSelector = document.getElementById('scenarioSelector');
        
        if (newScenarioBtn) {
            newScenarioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewScenarioModal();
            });
        }
        
        if (scenarioSelector) {
            scenarioSelector.addEventListener('change', (e) => {
                this.stateManager.switchScenario(e.target.value);
                this.loadScenarioData(e.target.value);
            });
        }
    }

    setupExportEvents() {
        const exportBtn = document.getElementById('exportPdfBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportToPDF();
            });
        }
    }

    collectFormData() {
        return {
            beneficioContable: parseFloat(document.getElementById('beneficioContable')?.value || 0),
            numEmpleados: parseInt(document.getElementById('numEmpleados')?.value || 0),
            modeloProyeccion: document.getElementById('modeloProyeccion')?.value || 'moderado',
            
            // ZEC
            aplicarZEC: document.getElementById('aplicarZEC')?.checked || false,
            inversionZEC: parseFloat(document.getElementById('inversionZEC')?.value || 0),
            empleosZEC: parseInt(document.getElementById('empleosZEC')?.value || 0),
            beneficiosZEC: parseFloat(document.getElementById('beneficiosZEC')?.value || 0),
            sectorZEC: document.getElementById('sectorZEC')?.value || '',
            
            // RIC
            aplicarRIC: document.getElementById('aplicarRIC')?.checked || false,
            dotacionRIC: parseFloat(document.getElementById('dotacionRIC')?.value || 0),
            
            // DIC
            aplicarDIC: document.getElementById('aplicarDIC')?.checked || false,
            inversionDIC: parseFloat(document.getElementById('inversionDIC')?.value || 0),
            tipoInversionDIC: document.getElementById('tipoInversionDIC')?.value || 'general',
            
            // I+D+i
            aplicarIDI: document.getElementById('aplicarIDI')?.checked || false,
            gastoPersonalIDI: parseFloat(document.getElementById('gastoPersonalIDI')?.value || 0),
            activosFijosIDI: parseFloat(document.getElementById('activosFijosIDI')?.value || 0),
            otrosGastosIDI: parseFloat(document.getElementById('otrosGastosIDI')?.value || 0),
            mediaAnteriorIDI: parseFloat(document.getElementById('mediaAnteriorIDI')?.value || 0),
            bonificacionPersonal: document.getElementById('bonificacionPersonal')?.checked || false,
            
            // IT
            aplicarIT: document.getElementById('aplicarIT')?.checked || false,
            gastosIT: parseFloat(document.getElementById('gastosIT')?.value || 0),
            
            // Audiovisual
            aplicarAudiovisual: document.getElementById('aplicarAudiovisual')?.checked || false,
            gastoProduccion: parseFloat(document.getElementById('gastoProduccion')?.value || 0),
            tipoProduccion: document.getElementById('tipoProduccion')?.value || 'espanola'
        };
    }

    calculateResults() {
        const formData = this.collectFormData();
        
        if (formData.beneficioContable <= 0) {
            this.hideResults();
            return;
        }

        const results = this.fiscalEngine.calculate(formData);
        const analysis = this.reasoningEngine.generateAnalysis(formData, results);
        
        this.displayResults(results, analysis);
        this.updateChart(results);
        this.showResults();
        
        // Guardar en el estado actual
        this.stateManager.updateCurrentScenario(formData, results);
    }

    displayResults(results, analysis) {
        // Actualizar KPIs
        document.getElementById('tipoEfectivo').textContent = results.tipoEfectivo.toFixed(2) + '%';
        document.getElementById('roiFiscal').textContent = results.roiFiscal.toFixed(2) + '%';
        document.getElementById('ahorroTotal').textContent = this.formatCurrency(results.ahorroFiscalTotal);
        document.getElementById('flujoLiberado').textContent = this.formatCurrency(results.flujoLiberado);
        document.getElementById('reduccionPayback').textContent = results.reduccionPayback.toFixed(1) + ' meses';
        document.getElementById('capacidadReinversion').textContent = this.formatCurrency(results.capacidadReinversion);

        // Actualizar desglose fiscal
        document.getElementById('beneficioContableResult').textContent = this.formatCurrency(results.beneficioContable);
        document.getElementById('baseImponible').textContent = this.formatCurrency(results.baseImponible);
        document.getElementById('cuotaIntegra').textContent = this.formatCurrency(results.cuotaIntegra);
        document.getElementById('totalDeducciones').textContent = this.formatCurrency(results.totalDeducciones);
        document.getElementById('cuotaLiquida').textContent = this.formatCurrency(results.cuotaLiquida);
        document.getElementById('carryForwards').textContent = this.formatCurrency(results.carryForwards);

        // Actualizar análisis estratégico
        document.getElementById('strategicAnalysis').innerHTML = analysis;
    }

    updateChart(results) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const chartData = {
            labels: ['Sin Incentivos', 'Con Incentivos'],
            datasets: [{
                label: 'Cuota Fiscal (€)',
                data: [results.cuotaSinIncentivos, results.cuotaLiquida],
                backgroundColor: ['#1FB8CD', '#FFC185'],
                borderColor: ['#1FB8CD', '#FFC185'],
                borderWidth: 2
            }]
        };

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparación Fiscal'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('es-ES', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'flex';
            resultsSection.classList.add('fade-in');
        }
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }

    showInfoModal(infoType) {
        const modal = document.getElementById('infoModal');
        const title = document.getElementById('infoModalTitle');
        const content = document.getElementById('infoModalContent');
        
        if (!modal || !title || !content) return;

        const infoData = this.getInfoContent(infoType);
        title.textContent = infoData.title;
        content.innerHTML = infoData.content;
        
        modal.style.display = 'flex';
    }

    getInfoContent(infoType) {
        const infoContent = {
            zec: {
                title: 'ZEC - Zona Especial Canaria',
                content: `
                    <h4>¿Qué es la ZEC?</h4>
                    <p>La Zona Especial Canaria es un régimen fiscal especial que permite tributar al 4% en el Impuesto sobre Sociedades.</p>
                    
                    <h4>Requisitos principales:</h4>
                    <ul>
                        <li>Inversión mínima según actividad</li>
                        <li>Creación de empleo (mínimo 5 empleos)</li>
                        <li>Dedicación exclusiva a la actividad ZEC</li>
                        <li>Actividad en sectores permitidos</li>
                    </ul>

                    <h4>Sectores permitidos:</h4>
                    <ul>
                        ${SECTORES_ZEC.map(sector => `<li>${sector}</li>`).join('')}
                    </ul>

                    <p><strong>Base legal:</strong> Ley 19/1994 del Régimen Económico y Fiscal de Canarias</p>
                `
            },
            ric: {
                title: 'RIC - Reserva de Inversiones Canarias',
                content: `
                    <h4>¿Qué es la RIC?</h4>
                    <p>La Reserva de Inversiones Canarias permite reducir la base imponible hasta un 90% del beneficio, destinando los fondos a inversiones productivas.</p>
                    
                    <h4>Características:</h4>
                    <ul>
                        <li>Reducción de base imponible hasta 90%</li>
                        <li>Plazo de materialización: 3 años</li>
                        <li>Inversiones en Canarias</li>
                        <li>Activos productivos nuevos</li>
                    </ul>

                    <h4>Ventajas:</h4>
                    <ul>
                        <li>Diferimiento fiscal</li>
                        <li>Mejora del flujo de caja</li>
                        <li>Fomento de la inversión</li>
                    </ul>

                    <p><strong>Base legal:</strong> Art. 27 Ley 19/1994 del REF</p>
                `
            },
            dic: {
                title: 'DIC - Deducción por Inversiones Canarias',
                content: `
                    <h4>¿Qué es la DIC?</h4>
                    <p>Deducción del 90% de las inversiones realizadas en activos fijos afectos a actividades económicas en Canarias.</p>
                    
                    <h4>Tipos de inversión:</h4>
                    <ul>
                        <li><strong>General:</strong> 90% sobre inversiones en activos fijos</li>
                        <li><strong>Estratégica:</strong> 90% con ventajas adicionales</li>
                    </ul>

                    <h4>Límites:</h4>
                    <ul>
                        <li>60% de la cuota íntegra (conjunto de deducciones)</li>
                        <li>Carry-forward de 10 años</li>
                    </ul>

                    <p><strong>Base legal:</strong> Art. 33 Ley 19/1994 del REF</p>
                `
            },
            'sectores-estrategicos': {
                title: 'Sectores Estratégicos DIC',
                content: `
                    <h4>Sectores considerados estratégicos:</h4>
                    <ul>
                        ${SECTORES_ESTRATEGICOS_DIC.map(sector => `<li>${sector}</li>`).join('')}
                    </ul>
                    
                    <p>Las inversiones en estos sectores pueden beneficiarse de condiciones especiales y mayor flexibilidad en la aplicación de la DIC.</p>
                `
            },
            idi: {
                title: 'I+D+i - Investigación, Desarrollo e Innovación',
                content: `
                    <h4>Deducciones por I+D+i:</h4>
                    <ul>
                        <li><strong>General:</strong> 45% de los gastos</li>
                        <li><strong>Incremental Canarias:</strong> 90% sobre el exceso</li>
                        <li><strong>Bonificación Personal:</strong> 30.6% adicional</li>
                    </ul>

                    <h4>Gastos deducibles:</h4>
                    <ul>
                        <li>Personal investigador</li>
                        <li>Activos fijos I+D</li>
                        <li>Gastos operativos</li>
                        <li>Servicios externos</li>
                    </ul>

                    <p><strong>Base legal:</strong> Art. 35 Ley 27/2014 del Impuesto sobre Sociedades</p>
                `
            },
            it: {
                title: 'IT - Innovación Tecnológica',
                content: `
                    <h4>Deducción por Innovación Tecnológica:</h4>
                    <p>Deducción por gastos en innovación tecnológica realizados en Canarias.</p>
                    
                    <h4>Gastos deducibles:</h4>
                    <ul>
                        <li>Software avanzado</li>
                        <li>Tecnologías de la información</li>
                        <li>Sistemas de comunicación</li>
                        <li>Equipos tecnológicos</li>
                    </ul>
                `
            },
            audiovisual: {
                title: 'Deducción Audiovisual',
                content: `
                    <h4>Deducción por Producciones Audiovisuales:</h4>
                    <ul>
                        <li><strong>Primer millón:</strong> 54%</li>
                        <li><strong>Resto:</strong> 45%</li>
                    </ul>

                    <h4>Tipos de producción:</h4>
                    <ul>
                        <li><strong>Española:</strong> Condiciones preferenciales</li>
                        <li><strong>Extranjera:</strong> Promoción internacional</li>
                    </ul>

                    <h4>Requisitos:</h4>
                    <ul>
                        <li>Rodaje en Canarias</li>
                        <li>Gastos mínimos locales</li>
                        <li>Certificación oficial</li>
                    </ul>
                `
            }
        };

        return infoContent[infoType] || { title: 'Información', content: 'Información no disponible.' };
    }

    showNewScenarioModal() {
        const modal = document.getElementById('newScenarioModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar fuente
        doc.setFont('helvetica');
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204);
        doc.text('SPEGC - Informe Estratégico de Inversión', 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Herramienta de Planificación Fiscal v7.0', 20, 30);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);
        
        // Línea separadora
        doc.setDrawColor(0, 102, 204);
        doc.line(20, 45, 190, 45);
        
        // Resultados principales
        let yPos = 60;
        doc.setFontSize(16);
        doc.setTextColor(0, 102, 204);
        doc.text('Resultados Principales', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const results = this.stateManager.getCurrentResults();
        if (results) {
            doc.text(`Tipo Impositivo Efectivo: ${results.tipoEfectivo.toFixed(2)}%`, 20, yPos);
            yPos += 8;
            doc.text(`ROI Fiscal: ${results.roiFiscal.toFixed(2)}%`, 20, yPos);
            yPos += 8;
            doc.text(`Ahorro Fiscal Total: ${this.formatCurrency(results.ahorroFiscalTotal)}`, 20, yPos);
            yPos += 8;
            doc.text(`Cuota Líquida: ${this.formatCurrency(results.cuotaLiquida)}`, 20, yPos);
        }
        
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('© 2025 SPEGC - Sociedad de Promoción Económica de Gran Canaria', 20, 280);
        doc.text('Este informe tiene carácter informativo. Consulte con asesores especializados.', 20, 290);
        
        doc.save('SPEGC_Informe_Fiscal.pdf');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    loadScenarioData(scenarioId) {
        const scenario = this.stateManager.getScenario(scenarioId);
        if (scenario && scenario.data) {
            // Cargar datos del escenario en el formulario
            Object.keys(scenario.data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = scenario.data[key];
                    } else {
                        element.value = scenario.data[key];
                    }
                }
            });
            
            // Actualizar campos visibles
            this.updateVisibleFields();
            
            // Recalcular resultados
            this.calculateResults();
        }
    }

    updateVisibleFields() {
        const incentiveCheckboxes = [
            { checkbox: 'aplicarZEC', fields: 'zecFields' },
            { checkbox: 'aplicarRIC', fields: 'ricFields' },
            { checkbox: 'aplicarDIC', fields: 'dicFields' },
            { checkbox: 'aplicarIDI', fields: 'idiFields' },
            { checkbox: 'aplicarIT', fields: 'itFields' },
            { checkbox: 'aplicarAudiovisual', fields: 'audiovisualFields' }
        ];

        incentiveCheckboxes.forEach(({ checkbox, fields }) => {
            const checkboxEl = document.getElementById(checkbox);
            const fieldsEl = document.getElementById(fields);
            
            if (checkboxEl && fieldsEl) {
                fieldsEl.style.display = checkboxEl.checked ? 'block' : 'none';
            }
        });
    }
}

// Clase para el motor de cálculo fiscal
class FiscalEngine {
    constructor() {
        this.params = FISCAL_PARAMS;
    }

    calculate(inputs) {
        // Aplicar factor de proyección
        const proyeccionFactor = MODELOS_PROYECCION[inputs.modeloProyeccion]?.factor || 1.0;
        const beneficioAjustado = inputs.beneficioContable * proyeccionFactor;

        // Calcular inversión total
        const inversionTotal = this.calculateTotalInversion(inputs);

        // Calcular RIC
        const dotacionRIC = inputs.aplicarRIC ? (beneficioAjustado * inputs.dotacionRIC / 100) : 0;
        const baseImponible = beneficioAjustado - dotacionRIC;

        // Calcular ZEC
        const zecResults = this.calculateZEC(inputs, baseImponible);
        
        // Calcular cuota íntegra
        const cuotaIntegra = this.calculateCuotaIntegra(baseImponible, zecResults);

        // Calcular deducciones
        const deducciones = this.calculateDeducciones(inputs, cuotaIntegra);

        // Cuota líquida
        const cuotaLiquida = Math.max(0, cuotaIntegra - deducciones.aplicadas);

        // Cálculos adicionales
        const cuotaSinIncentivos = beneficioAjustado * this.params.tributacion_general;
        const ahorroFiscalTotal = cuotaSinIncentivos - cuotaLiquida;
        
        // KPIs estratégicos
        const tipoEfectivo = (cuotaLiquida / beneficioAjustado) * 100;
        const roiFiscal = inversionTotal > 0 ? (ahorroFiscalTotal / inversionTotal) * 100 : 0;
        const flujoLiberado = ahorroFiscalTotal;
        const capacidadReinversion = dotacionRIC + ahorroFiscalTotal;

        // Cálculo de payback
        const paybackSinAhorro = inversionTotal > 0 ? inversionTotal / beneficioAjustado : 0;
        const paybackConAhorro = inversionTotal > 0 ? inversionTotal / (beneficioAjustado + ahorroFiscalTotal) : 0;
        const reduccionPayback = (paybackSinAhorro - paybackConAhorro) * 12;

        return {
            beneficioContable: inputs.beneficioContable,
            beneficioAjustado,
            baseImponible,
            dotacionRIC,
            cuotaIntegra,
            totalDeducciones: deducciones.aplicadas,
            carryForwards: deducciones.pendientes,
            cuotaLiquida,
            cuotaSinIncentivos,
            ahorroFiscalTotal,
            tipoEfectivo,
            roiFiscal,
            flujoLiberado,
            capacidadReinversion,
            reduccionPayback,
            inversionTotal,
            zecResults,
            detallesDeducciones: deducciones.detalle
        };
    }

    calculateTotalInversion(inputs) {
        let total = 0;
        if (inputs.aplicarZEC) total += inputs.inversionZEC;
        if (inputs.aplicarDIC) total += inputs.inversionDIC;
        if (inputs.aplicarIDI) {
            total += inputs.gastoPersonalIDI + inputs.activosFijosIDI + inputs.otrosGastosIDI;
        }
        if (inputs.aplicarIT) total += inputs.gastosIT;
        if (inputs.aplicarAudiovisual) total += inputs.gastoProduccion;
        return total;
    }

    calculateZEC(inputs, baseImponible) {
        if (!inputs.aplicarZEC || inputs.beneficiosZEC <= 0) {
            return { aplicable: false, baseZEC: 0, cuotaZEC: 0, limiteBase: 0 };
        }

        // Calcular límite de base imponible ZEC
        const limiteBaseImponibleZEC = inputs.empleosZEC <= this.params.zec_limite_empleos_base
            ? this.params.zec_limite_base_minimo
            : this.params.zec_limite_base_minimo + (this.params.zec_incremento_por_empleo * (inputs.empleosZEC - this.params.zec_limite_empleos_base));

        // Calcular beneficio ZEC real
        const beneficioZECPorcentaje = inputs.beneficiosZEC / 100;
        const beneficioZECBruto = baseImponible * beneficioZECPorcentaje;
        const baseZEC = Math.min(beneficioZECBruto, limiteBaseImponibleZEC);
        const cuotaZEC = baseZEC * this.params.tributacion_zec;

        return {
            aplicable: true,
            baseZEC,
            cuotaZEC,
            limiteBase: limiteBaseImponibleZEC,
            beneficioZECBruto
        };
    }

    calculateCuotaIntegra(baseImponible, zecResults) {
        if (zecResults.aplicable) {
            const baseGeneral = baseImponible - zecResults.baseZEC;
            const cuotaGeneral = baseGeneral * this.params.tributacion_general;
            return cuotaGeneral + zecResults.cuotaZEC;
        } else {
            return baseImponible * this.params.tributacion_general;
        }
    }

    calculateDeducciones(inputs, cuotaIntegra) {
        const deducciones = {
            DIC: 0,
            IDI: 0,
            IT: 0,
            Audiovisual: 0
        };

        // DIC
        if (inputs.aplicarDIC && inputs.inversionDIC > 0) {
            deducciones.DIC = inputs.inversionDIC * this.params.dic_porcentaje;
        }

        // I+D+i
        if (inputs.aplicarIDI) {
            const gastoTotal = inputs.gastoPersonalIDI + inputs.activosFijosIDI + inputs.otrosGastosIDI;
            
            // Deducción general
            let deduccionIDI = gastoTotal * this.params.idi.general;
            
            // Deducción incremental
            if (inputs.mediaAnteriorIDI > 0 && gastoTotal > inputs.mediaAnteriorIDI) {
                const incremento = gastoTotal - inputs.mediaAnteriorIDI;
                deduccionIDI += incremento * this.params.idi.incremental_canarias;
            }
            
            // Bonificación personal
            if (inputs.bonificacionPersonal && inputs.gastoPersonalIDI > 0) {
                deduccionIDI += inputs.gastoPersonalIDI * this.params.idi.bonificacion_personal_canarias;
            }
            
            deducciones.IDI = deduccionIDI;
        }

        // IT
        if (inputs.aplicarIT && inputs.gastosIT > 0) {
            deducciones.IT = inputs.gastosIT * 0.45; // Asumiendo 45% para IT
        }

        // Audiovisual
        if (inputs.aplicarAudiovisual && inputs.gastoProduccion > 0) {
            const tramo1 = Math.min(inputs.gastoProduccion, this.params.audiovisual.tramo1_limite);
            const tramo2 = Math.max(0, inputs.gastoProduccion - this.params.audiovisual.tramo1_limite);
            
            deducciones.Audiovisual = (tramo1 * this.params.audiovisual.tramo1_porcentaje) + 
                                     (tramo2 * this.params.audiovisual.resto_porcentaje);
        }

        // Calcular total de deducciones
        const totalDeducciones = Object.values(deducciones).reduce((sum, val) => sum + val, 0);
        
        // Aplicar límite del 60%
        const limiteMaximo = cuotaIntegra * this.params.limite_conjunto_deducciones;
        const deduccionesAplicadas = Math.min(totalDeducciones, limiteMaximo);
        const deduccionesPendientes = totalDeducciones - deduccionesAplicadas;

        return {
            detalle: deducciones,
            total: totalDeducciones,
            aplicadas: deduccionesAplicadas,
            pendientes: deduccionesPendientes
        };
    }
}

// Clase para gestión de estado y escenarios
class StateManager {
    constructor() {
        this.scenarios = {
            default: {
                name: 'Escenario Principal',
                data: null,
                results: null
            }
        };
        this.currentScenario = 'default';
    }

    createScenario(name, copyFromCurrent = false) {
        const id = 'scenario_' + Date.now();
        this.scenarios[id] = {
            name: name,
            data: copyFromCurrent ? this.getCurrentData() : null,
            results: null
        };
        
        this.updateScenarioSelector();
        return id;
    }

    switchScenario(scenarioId) {
        if (this.scenarios[scenarioId]) {
            this.currentScenario = scenarioId;
        }
    }

    updateCurrentScenario(data, results) {
        if (this.scenarios[this.currentScenario]) {
            this.scenarios[this.currentScenario].data = data;
            this.scenarios[this.currentScenario].results = results;
        }
    }

    getCurrentData() {
        return this.scenarios[this.currentScenario]?.data;
    }

    getCurrentResults() {
        return this.scenarios[this.currentScenario]?.results;
    }

    getScenario(scenarioId) {
        return this.scenarios[scenarioId];
    }

    updateScenarioSelector() {
        const selector = document.getElementById('scenarioSelector');
        if (!selector) return;

        selector.innerHTML = '';
        Object.keys(this.scenarios).forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = this.scenarios[id].name;
            if (id === this.currentScenario) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }
}

// Clase para análisis estratégico y recomendaciones
class ReasoningEngine {
    generateAnalysis(inputs, results) {
        let analysis = '<div class="strategic-content">';
        
        // Análisis principal
        analysis += this.generateMainAnalysis(inputs, results);
        
        // Recomendaciones específicas
        analysis += this.generateRecommendations(inputs, results);
        
        // Análisis de sensibilidad
        analysis += this.generateSensitivityAnalysis(inputs, results);
        
        analysis += '</div>';
        return analysis;
    }

    generateMainAnalysis(inputs, results) {
        let analysis = '<div class="strategic-insight">';
        analysis += '<h4>💡 Análisis Estratégico Integral</h4>';
        
        const efectividad = results.tipoEfectivo < 15 ? 'excelente' : 
                           results.tipoEfectivo < 20 ? 'muy buena' : 'mejorable';
        
        analysis += `<p>La configuración fiscal analizada presenta una <strong>efectividad ${efectividad}</strong> 
                     con un tipo impositivo efectivo del <strong>${results.tipoEfectivo.toFixed(2)}%</strong>, 
                     generando un ahorro fiscal de <strong>${this.formatCurrency(results.ahorroFiscalTotal)}</strong>.</p>`;
        
        if (results.roiFiscal > 0) {
            analysis += `<p>El ROI fiscal de la inversión alcanza el <strong>${results.roiFiscal.toFixed(2)}%</strong>, 
                         indicando una alta rentabilidad de los incentivos aplicados.</p>`;
        }
        
        if (results.reduccionPayback > 0) {
            analysis += `<p>La optimización fiscal reduce el período de recuperación en 
                         <strong>${results.reduccionPayback.toFixed(1)} meses</strong>, 
                         mejorando significativamente la liquidez empresarial.</p>`;
        }
        
        analysis += '</div>';
        return analysis;
    }

    generateRecommendations(inputs, results) {
        let recommendations = '<div class="strategic-recommendation">';
        recommendations += '<h4>🎯 Recomendaciones Estratégicas</h4>';
        
        // Análisis RIC vs Deducciones
        if (results.carryForwards > 0 && inputs.aplicarRIC && inputs.dotacionRIC > 10) {
            const reduccionRIC = inputs.dotacionRIC - 10;
            const ahorroEstimado = results.carryForwards * 0.5; // Estimación
            
            recommendations += `<p><strong>💡 Oportunidad de Optimización:</strong> 
                               Considera reducir la dotación RIC en ${reduccionRIC} puntos porcentuales. 
                               Esto permitiría aplicar aproximadamente ${this.formatCurrency(ahorroEstimado)} 
                               adicionales de deducciones pendientes, mejorando el flujo de caja inmediato.</p>`;
        }
        
        // Recomendaciones específicas por incentivo
        if (inputs.aplicarZEC && results.zecResults.baseZEC < results.zecResults.beneficioZECBruto) {
            recommendations += `<p><strong>⚠️ Límite ZEC:</strong> 
                               El límite de base imponible ZEC está restringiendo el beneficio. 
                               Considera aumentar el empleo ZEC para incrementar el límite.</p>`;
        }
        
        if (!inputs.aplicarIDI && inputs.beneficioContable > 100000) {
            recommendations += `<p><strong>🔬 Oportunidad I+D+i:</strong> 
                               Con el nivel de beneficios actual, la aplicación de deducciones por I+D+i 
                               podría generar ahorros significativos. Evalúa actividades que puedan calificar.</p>`;
        }
        
        recommendations += '</div>';
        return recommendations;
    }

    generateSensitivityAnalysis(inputs, results) {
        if (results.carryForwards <= 0) return '';
        
        let analysis = '<div class="strategic-insight">';
        analysis += '<h4>📊 Análisis de Sensibilidad</h4>';
        
        analysis += `<p>Se detectan <strong>${this.formatCurrency(results.carryForwards)}</strong> 
                     en deducciones pendientes de aplicar. Esto representa una oportunidad de 
                     optimización fiscal en ejercicios futuros.</p>`;
        
        // Estrategia de monetización
        const yearsToApply = Math.ceil(results.carryForwards / (results.cuotaIntegra * 0.6));
        analysis += `<p>Con la cuota actual, estas deducciones se aplicarían completamente en 
                     aproximadamente <strong>${yearsToApply} ejercicios</strong>. 
                     Considera estrategias para acelerar su aplicación.</p>`;
        
        analysis += '</div>';
        return analysis;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Funciones globales para modales
function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeNewScenarioModal() {
    const modal = document.getElementById('newScenarioModal');
    const nameInput = document.getElementById('scenarioName');
    const copyCheckbox = document.getElementById('copyCurrentData');
    
    if (modal) modal.style.display = 'none';
    if (nameInput) nameInput.value = '';
    if (copyCheckbox) copyCheckbox.checked = false;
}

function createScenario() {
    const nameInput = document.getElementById('scenarioName');
    const copyCheckbox = document.getElementById('copyCurrentData');
    
    if (!nameInput || !nameInput.value.trim()) {
        alert('Por favor, introduce un nombre para el escenario.');
        return;
    }
    
    const scenarioId = window.spegcApp.stateManager.createScenario(
        nameInput.value.trim(), 
        copyCheckbox?.checked || false
    );
    
    // Cambiar al nuevo escenario
    const selector = document.getElementById('scenarioSelector');
    if (selector) {
        selector.value = scenarioId;
        window.spegcApp.stateManager.switchScenario(scenarioId);
        
        if (copyCheckbox?.checked) {
            window.spegcApp.loadScenarioData(scenarioId);
        }
    }
    
    closeNewScenarioModal();
}

// Eventos de clic en modales para cerrar
document.addEventListener('click', (e) => {
    // Solo cerrar si se hace clic directamente en el modal (fondo)
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'infoModal') {
            closeInfoModal();
        } else if (e.target.id === 'newScenarioModal') {
            closeNewScenarioModal();
        }
    }
});

// Prevenir el menú contextual del clic derecho
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, iniciando aplicación SPEGC...');
    
    // Crear instancia global de la aplicación
    window.spegcApp = new SPEGCApp();
    
    // Inicializar la aplicación
    await window.spegcApp.init();
    
    console.log('Aplicación SPEGC inicializada correctamente');
});