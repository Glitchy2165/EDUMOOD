const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

const libros = [
    {
        titulo: "El Poder de la Gratitud",
        contenido: "La gratitud es una de las emociones más poderosas que podemos cultivar. Cuando practicamos la gratitud regularmente, nuestro cerebro comienza a buscar automáticamente las cosas buenas en nuestra vida. Esto no significa ignorar los desafíos, sino encontrar el equilibrio entre reconocer las dificultades y apreciar las bendiciones. La gratitud nos ayuda a mantener una perspectiva positiva incluso en tiempos difíciles. Comienza cada día escribiendo tres cosas por las que estés agradecido. Con el tiempo, notarás cómo tu estado de ánimo mejora y tu resiliencia aumenta."
    },
    {
        titulo: "Mindfulness en la Vida Cotidiana",
        contenido: "El mindfulness es la práctica de estar presente en el momento actual sin juzgar. Es una herramienta poderosa para reducir el estrés y mejorar nuestro bienestar mental. Puedes practicar mindfulness en cualquier momento del día: mientras comes, caminas, o incluso mientras te lavas los dientes. La clave es prestar atención plena a lo que estás haciendo, notando las sensaciones, olores, sabores y pensamientos que surgen. Con práctica regular, el mindfulness puede ayudarte a manejar mejor las emociones difíciles y encontrar más paz interior."
    },
    {
        titulo: "Construyendo Resiliencia",
        contenido: "La resiliencia es la capacidad de adaptarse y recuperarse de las adversidades. Es como un músculo que podemos fortalecer con práctica. Las personas resilientes no evitan los problemas, sino que los enfrentan con confianza y flexibilidad. Desarrollar resiliencia implica cultivar una mentalidad de crecimiento, mantener conexiones sociales significativas, y aprender de las experiencias difíciles. Recuerda que cada desafío es una oportunidad para crecer y fortalecerte. La resiliencia no significa ser perfecto, sino ser capaz de levantarse después de caer."
    },
    {
        titulo: "El Arte de la Comunicación Asertiva",
        contenido: "La comunicación asertiva es el equilibrio perfecto entre ser pasivo y ser agresivo. Es expresar tus necesidades, sentimientos y opiniones de manera clara y respetuosa, sin violar los derechos de los demás. La asertividad incluye usar declaraciones en primera persona, mantener contacto visual, y escuchar activamente. Practicar la comunicación asertiva mejora las relaciones, reduce conflictos, y aumenta la autoestima. Recuerda que tienes derecho a expresar tus opiniones y establecer límites saludables."
    },
    {
        titulo: "Cultivando la Autoestima",
        contenido: "La autoestima es la base de nuestro bienestar emocional. Es la evaluación que hacemos de nosotros mismos y nuestro valor como personas. Una autoestima saludable no significa ser perfecto, sino aceptarse a uno mismo con compasión. Para cultivar la autoestima, practica la autocompasión, celebra tus logros por pequeños que sean, y rodéate de personas que te apoyen. Recuerda que eres único y valioso simplemente por ser quien eres. La autoestima se construye día a día con pequeños actos de amor propio."
    }
];

async function addBooks() {
    try {
        console.log('📚 Agregando libros a la biblioteca...');
        
        for (const libro of libros) {
            const [result] = await db.query(
                "INSERT INTO audiolibros (titulo, contenido) VALUES (?, ?)",
                [libro.titulo, libro.contenido]
            );
            console.log(`✅ "${libro.titulo}" agregado con ID: ${result.insertId}`);
        }
        
        console.log('\n🎉 Todos los libros han sido agregados exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

addBooks(); 