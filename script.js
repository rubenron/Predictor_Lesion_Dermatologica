document.addEventListener("DOMContentLoaded", async () => {
    const inputImagen = document.getElementById("input-imagen");
    const imagenPreview = document.getElementById("imagen-preview");
    const resultadoDiv = document.getElementById("resultado");
    let modelo;

    try {
        console.log("Cargando el modelo...");
        modelo = await tf.loadGraphModel("./model.json");
        console.log("Modelo cargado correctamente.");
    } catch (error) {
        console.error("Error al cargar el modelo:", error);
        resultadoDiv.innerHTML = "Error al cargar el modelo. Por favor verifica los archivos.";
        return;  // Detener el script si el modelo no se carga correctamente
    }

    inputImagen.addEventListener("change", async (event) => {
        if (!modelo) {
            resultadoDiv.innerHTML = "El modelo no se ha cargado correctamente.";
            return;
        }

        const archivo = event.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = async function (e) {
                const imagenURL = e.target.result;
                imagenPreview.src = imagenURL;
                imagenPreview.style.display = "block";

                // Cargar la imagen en un elemento HTMLImageElement para procesar
                const img = new Image();
                img.src = imagenURL;
                img.onload = async () => {
                    try {
                        const tensorImagen = tf.browser
                            .fromPixels(img)
                            .resizeNearestNeighbor([224, 224]) // Ajustar al tamaño esperado por el modelo
                            .toFloat()
                            .div(tf.scalar(255.0)) // Normalizar los valores de píxel a [0, 1]
                            .expandDims(); // Añadir una dimensión para representar el lote

                        // Realizar la predicción
                        const predicciones = await modelo.predict(tensorImagen).data();

                        // Obtener el índice de la predicción más alta
                        const indiceMayor = predicciones.indexOf(Math.max(...predicciones));
                        const nombresLesiones = [
                            "bcc: Carcinoma Basocelular",
                            "akiec: Queratosis Actínica",
                            "mel: Melanoma",
                            "nv: Nevus Melanocítico",
                            "bkl: Queratosis Benigna",
                            "df: Dermatofibroma"
                        ];

                        // Mostrar el resultado
                        resultadoDiv.innerHTML = `
                            <p>Resultado del Análisis:</p>
                            <ul>
                                ${nombresLesiones[indiceMayor]} - Probabilidad: ${(predicciones[indiceMayor] * 100).toFixed(2)}%
                            </ul>
                        `;
                    } catch (error) {
                        console.error("Error al realizar la predicción:", error);
                        resultadoDiv.innerHTML = "Error al realizar la predicción. Por favor, inténtalo nuevamente.";
                    }
                };
            };
            lector.readAsDataURL(archivo);
        }
    });
});
