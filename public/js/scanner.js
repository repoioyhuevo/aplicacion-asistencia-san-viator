const barcodeInput = document.getElementById('barcodeInput');
const resultDiv = document.getElementById('result');

// Diagnosticar el elemento
console.log('🔍 DIAGNÓSTICO INICIAL:');
console.log('🔍 barcodeInput encontrado:', barcodeInput);
console.log('🔍 barcodeInput value:', barcodeInput ? barcodeInput.value : 'NO EXISTE');
console.log('🔍 barcodeInput id:', barcodeInput ? barcodeInput.id : 'NO EXISTE');

// Agregar TODOS los eventos posibles para capturar el código
barcodeInput.addEventListener('input', function(e) {
    console.log('🎯 EVENTO INPUT CAPTURADO:', this.value);
    console.log('🎯 Evento completo:', e);
});

barcodeInput.addEventListener('change', function(e) {
    console.log('🎯 EVENTO CHANGE CAPTURADO:', this.value);
});

barcodeInput.addEventListener('keydown', function(e) {
    console.log('🎯 EVENTO KEYDOWN:', e.key, 'Código:', e.keyCode);
});

barcodeInput.addEventListener('keyup', function(e) {
    console.log('🎯 EVENTO KEYUP:', e.key, 'Valor:', this.value);
});

barcodeInput.addEventListener('keypress', function(e) {
    console.log('🎯 EVENTO KEYPRESS:', e.key);
});

// Verificar si el lector agrega un Enter al final
barcodeInput.addEventListener('input', function(e) {
    const value = this.value;
    console.log('📦 Valor completo:', value);
    console.log('📦 Longitud:', value.length);
    console.log('📦 Caracteres:', Array.from(value).map(c => c.charCodeAt(0)));
    
    // Si el valor tiene un Enter al final, procesarlo
    if (value.includes('\n') || value.includes('\r')) {
        console.log('🔔 ENTER DETECTADO - Procesando código...');
        this.value = value.replace(/[\n\r]/g, ''); // Limpiar Enter
        procesarCodigo(this.value);
    }
});

// Función separada para procesar
async function procesarCodigo(codigo) {
    console.log('🚀 INICIANDO PROCESAMIENTO:', codigo);
    
    if (!codigo) {
        console.log('❌ Código vacío');
        return;
    }

    try {
        console.log('🌐 Enviando al servidor...');
        const response = await fetch('/api/barcode/registrar-asistencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codigoBarras: codigo })
        });

        console.log('📡 Respuesta recibida, status:', response.status);
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

// También probar con un timeout automático (por si el lector no envía Enter)
let timeoutId;
barcodeInput.addEventListener('input', function() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        const value = this.value.trim();
        if (value.length > 3) { // Mínimo 3 caracteres para ser un código válido
            console.log('⏰ TIMEOUT - Procesando código automáticamente:', value);
            procesarCodigo(value);
        }
    }, 500); // Esperar 500ms después del último input
});

console.log('✅ Diagnóstico cargado - Escanea un código ahora');