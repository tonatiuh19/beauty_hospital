import { motion } from "framer-motion";
import { Zap, Calendar, CreditCard, MessageSquare, Check } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Elige tu Servicio",
    description:
      "Selecciona de nuestro amplio catálogo de tratamientos de depilación premium y servicios de bienestar.",
    icon: Zap,
    color: "from-primary to-pink-500",
  },
  {
    number: 2,
    title: "Agenda tu Cita",
    description:
      "Reserva tu cita en la fecha y hora que mejor se adapte a tu agenda con nuestro sistema de reserva fácil.",
    icon: Calendar,
    color: "from-secondary to-primary",
  },
  {
    number: 3,
    title: "Paga de Forma Segura",
    description:
      "Realiza el pago seguro de tu tratamiento mediante nuestras opciones de pago confiables y encriptadas.",
    icon: CreditCard,
    color: "from-primary to-secondary",
  },
  {
    number: 4,
    title: "Recibe Notificaciones",
    description:
      "Mantente informado sobre tu cita y recordatorios a través de WhatsApp para no perder ningún detalle.",
    icon: MessageSquare,
    color: "from-accent to-cyan-500",
  },
  {
    number: 5,
    title: "Recibe tu Servicio",
    description:
      "Llega a nuestro hospital y disfruta de tu tratamiento con nuestros especialistas certificados.",
    icon: Check,
    color: "from-emerald-500 to-teal-500",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Nuestro <span className="text-gradient">Proceso Simple</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Reserva tu tratamiento en solo 5 pasos simples. Rápido, seguro y confiable.
          </p>
        </motion.div>

        {/* Steps timeline */}
        <div className="relative">
          {/* Connector line - visible on larger screens */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20" />

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Card */}
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all h-full flex flex-col relative z-10">
                    {/* Step number badge */}
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <span className="text-white font-bold text-lg">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="mb-4">
                      <Icon
                        className={`text-gray-400 group-hover:text-primary transition-colors`}
                        size={32}
                      />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm flex-grow">
                      {step.description}
                    </p>

                    {/* Arrow for next step - visible on larger screens */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute -right-12 top-1/3 text-primary/30">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA below process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-gray-600 mb-6">
            ¿Listo para comenzar? Selecciona un servicio y comienza el proceso hoy mismo.
          </p>
          <button className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105">
            Comenzar Ahora
          </button>
        </motion.div>
      </div>
    </section>
  );
}
