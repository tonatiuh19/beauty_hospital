import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "¿Qué tipos de tratamientos ofrece All Beauty?",
    answer:
      "Ofrecemos una amplia gama de tratamientos no quirúrgicos, incluyendo inyecciones como botox y rellenos dérmicos, remodelación corporal, tratamientos láser, terapia hormonal, reafirmación de la piel y más. Nuestros servicios están diseñados para mejorar la apariencia y el bienestar.",
  },
  {
    question: "¿All Beauty es un spa médico o un spa de día?",
    answer:
      "All Beauty es un spa médico especializado que combina tratamientos estéticos avanzados con supervisión médica profesional, garantizando los más altos estándares de seguridad y eficacia.",
  },
  {
    question: "¿Qué puedo esperar durante mi primera visita?",
    answer:
      "Durante su primera visita, nuestro equipo realizará una consulta completa para entender sus objetivos y necesidades. Evaluaremos su piel, discutiremos las opciones de tratamiento y crearemos un plan personalizado para usted.",
  },
  {
    question: "¿Son seguros los tratamientos?",
    answer:
      "Sí, todos nuestros tratamientos son realizados por especialistas certificados utilizando tecnología de última generación aprobada internacionalmente. Seguimos estrictos protocolos de seguridad e higiene.",
  },
  {
    question:
      "¿Necesito programar una consulta antes de recibir el tratamiento?",
    answer:
      "Recomendamos una consulta inicial para evaluar sus necesidades específicas y determinar el mejor plan de tratamiento. Sin embargo, algunos tratamientos básicos pueden realizarse el mismo día.",
  },
  {
    question: "¿Cuánto tiempo lleva usted en el negocio?",
    answer:
      "All Beauty cuenta con años de experiencia en el sector de la estética médica, respaldado por un equipo de profesionales altamente calificados y certificados internacionalmente.",
  },
  {
    question: "¿Cómo sé qué tratamiento es adecuado para mí?",
    answer:
      "Durante su consulta gratuita, nuestros especialistas evaluarán su tipo de piel, preocupaciones específicas y objetivos personales para recomendar el tratamiento más adecuado para sus necesidades.",
  },
  {
    question: "¿Cómo programo una cita?",
    answer:
      "Puede programar su cita fácilmente a través de nuestro sistema de reservas en línea, llamando directamente a nuestra clínica, o enviándonos un mensaje por WhatsApp. Ofrecemos horarios flexibles para su comodidad.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-32 bg-luxury-cream-light relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Preguntas Frecuentes
          </h2>
          <p className="text-base text-gray-700">
            ¿Tiene preguntas sobre nuestro All Beauty?
            <br />
            Consulte algunas de nuestras preguntas frecuentes a continuación.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-semibold text-foreground pr-8">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  {openIndex === index ? (
                    <Minus size={20} className="text-white" />
                  ) : (
                    <Plus size={20} className="text-white" />
                  )}
                </div>
              </button>

              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6"
                >
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
