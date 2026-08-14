---
locale: "es"
slug: "how-agent-operations-work"
canonicalPath: "/guides/how-agent-operations-work"
title: "Cómo funcionan las operaciones de agentes: de la solicitud al artefacto revisado"
heading: "Cómo funcionan las operaciones de agentes: de la solicitud al artefacto revisado"
description: "Siga un ciclo operativo del agente de ocho etapas que asigna responsables, delimita herramientas, registra evidencia, trata efectos secundarios inciertos y termina con una revisión."
eyebrow: "Guía de operaciones de agentes"
author: "Toone Content"
authorType: "Organization"
authorUrl: "/en/editorial-policy"
published: "2026-08-14"
updated: "2026-08-14"
readTime: "17 min de lectura"
featured: true
image: "/assets/og/toone-og.png"
imageAlt: "Guía de Toone sobre operaciones de agentes"
sourceWorkId: "CNT-editorial-post-a44edaec"
sourceSha256: "13b50e4042a4da8ad8226563b2a58035ae3e6c97553019f2eb1bae67d973b4f8"
englishSourceSha256: "374faf21eaf71d93e2efb73c4427942b8940affd2ecbe290eaf98a9d2643082a"
translationManifestSha256: "fd5ea2d9ce3434b9a3f81d95a4346d61e82683ee97e4dabbc9ddfe3155c43bbd"
translationQaSha256: "ca54125394b1bd9704c75329714d633c01a109c6e10422ad177509154b8894de"
---
Un ciclo operativo del agente es un recorrido controlado desde una solicitud delimitada hasta un artefacto revisado. El ciclo asigna responsabilidades, registra las entradas, limita las herramientas y los datos, registra las acciones y la evidencia, comprueba el resultado, trata los fallos y termina en un estado explícito de aceptación, revisión o detención.

Esa es la definición de trabajo utilizada en esta guía. Combina orientaciones actuales de proveedores y de gestión de riesgos con un contrato operativo práctico. No es un estándar universal ni la descripción de un producto específico.

El ciclo importa porque la afirmación de un agente de que terminó solo constituye un tipo de evidencia. Un registro operativo útil separa lo que observó una fuente o un sistema, lo que exige un diseño, lo que afirma el agente, lo que decidió un operador responsable y lo que sigue sin resolverse.

## Empiece por decidir si el trabajo necesita un agente

No empiece por una herramienta. Empiece por el trabajo, por la persona responsable de la decisión y por la evidencia necesaria al final.

La [orientación de Microsoft sobre planificación empresarial para agentes de IA](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan) distingue el trabajo predecible que puede resolverse con código convencional, las tareas de recuperación estática de información y el trabajo que requiere razonamiento dinámico o uso de herramientas. La [guía de Anthropic para crear agentes eficaces](https://www.anthropic.com/engineering/building-effective-agents) también separa los flujos de trabajo predefinidos de los agentes que dirigen su propio proceso y uso de herramientas, y recomienda el diseño menos complejo que se ajuste a la tarea. Son ayudas para decidir, no leyes técnicas rígidas.

Use un programa determinista o un flujo de trabajo predefinido cuando las reglas, el orden de los pasos, las entradas y el resultado esperado sean estables y comprobables. Use recuperación de información cuando el trabajo consista en encontrar información fundamentada en un conjunto conocido de documentos sin secuencias dinámicas de herramientas. Mantenga el flujo bajo responsabilidad humana cuando el acto central sea una decisión de política, responsabilidad, criterio o aceptación y la ejecución dinámica aporte poco.

Un agente se convierte en una opción razonable cuando el trabajo requiere decisiones contextuales entre entradas no estructuradas, secuencias cambiantes de herramientas o excepciones, y cuando la organización aún puede definir:

- el resultado y su responsable;
- las entradas, herramientas, datos y destinos permitidos;
- las acciones prohibidas y los puntos de aprobación;
- la evidencia que otra persona revisora pueda inspeccionar;
- un responsable de recuperación y un estado seguro de detención;
- una prueba de aceptación para el artefacto final.

Si no se pueden completar esos campos, añadir un agente hace que la incertidumbre sea más difícil de ver.

## Use cinco categorías de evidencia

Estas etiquetas evitan que el relato de un agente se trate como prueba. Constituyen el modelo editorial de esta guía.

| Categoría de evidencia | Significado | Qué puede sustentar | Qué no puede sustentar |
|---|---|---|---|
| **Hecho de la fuente** | Un documento primario con fecha y hora, una respuesta del sistema responsable o un efecto observado de forma independiente. | Que el hecho indicado se observó dentro del alcance registrado de la fuente. | La integridad más allá de ese alcance o un efecto secundario no observado. |
| **Regla de diseño documentada** | Un contrato operativo versionado indica que debe existir una función, etapa, aprobación, registro de evidencia o regla de recuperación. | Que la organización diseñó y registró la regla. | Que el software la aplicó o que todas las ejecuciones la siguieron. |
| **Afirmación del agente** | Un agente declara una intención, interpretación, resultado o causa. | Una hipótesis o un resultado propuesto para revisión. | La ejecución, la corrección, la aprobación o la finalización del trabajo empresarial. |
| **Decisión del operador** | Una persona responsable o un sistema autorizado aprueba, rechaza, acepta, detiene o elige una vía de recuperación. | Que la decisión se conoce cuando se vinculan su responsable, alcance, evidencia, destino y momento. | Que la acción aprobada ocurrió o tuvo éxito. |
| **Incógnita sin resolver** | La evidencia disponible no permite establecer qué ocurrió ni si el resultado es válido. | Un motivo para detenerse, conciliar o recopilar evidencia más sólida. | Permiso para adivinar, reintentar o declarar el éxito. |

Un evento puede incluir varias categorías. Un agente puede proponer escribir un archivo, un operador puede aprobar un destino y una suma de comprobación, y el sistema de destino puede confirmar después la escritura. Esos elementos son una afirmación del agente, una decisión del operador y un hecho de la fuente. Combinarlos en «el agente completó el trabajo» oculta las distinciones que necesita quien revisa.

## El ciclo operativo de ocho etapas

Cada etapa debe mostrar la persona responsable, la entrada, el alcance permitido, la acción, la decisión, el resultado, el registro de evidencia, el estado de fallo, el responsable de recuperación y la condición de salida pertinentes en ese punto. Los campos siguientes forman un único contrato operativo, sin afirmar que todas las implementaciones usen los mismos nombres.

| Etapa | Responsabilidad y decisión | Entrada, herramientas, acción y entrega | Resultado, evidencia, fallo, recuperación y salida |
|---:|---|---|---|
| **1. Delimitar la solicitud** | La persona responsable del resultado define el resultado empresarial y decide si se acepta la solicitud. | Registre el ID del trabajo, la tarea, la audiencia, los objetivos excluidos, el límite de riesgo y los criterios de aceptación. Todavía no hace falta una herramienta de ejecución. | La salida exige un alcance aceptado. Una responsabilidad ambigua o unos objetivos contradictorios devuelven el trabajo al responsable de la solicitud. |
| **2. Registrar las entradas** | El responsable de las fuentes o un operador confirma qué evidencia puede entrar en el trabajo. | Registre las identidades de las fuentes, las fechas o versiones, las sumas de comprobación cuando resulten útiles, los límites de vigencia y las reglas para datos faltantes. Entregue un manifiesto inmutable de las entradas. | La salida exige un registro de evidencia de las entradas e incógnitas explícitas. La falta de evidencia imprescindible detiene o restringe el trabajo. |
| **3. Asignar responsabilidades** | El responsable del resultado nombra al agente o la función del flujo de trabajo, al operador, a quien revisa, al responsable de aprobación y al responsable de recuperación. | Defina quién puede proponer, ejecutar, aprobar, revisar, reintentar y detener. Registre los conflictos y las funciones no disponibles. | La salida exige un mapa de responsabilidades. Una decisión sin responsable sigue siendo un bloqueo. |
| **4. Planificar dentro del alcance** | El operador o el responsable de la política decide si la vía propuesta permanece dentro del contrato. | Registre los pasos, las herramientas y los datos permitidos, el alcance del destino, las acciones prohibidas, los activadores de aprobación, el presupuesto y los límites de reintentos. Entregue un plan revisable o una instrucción determinista. | La salida exige un plan aceptado. Una ampliación del alcance vuelve al responsable de la decisión en vez de darse por supuesta. |
| **5. Ejecutar y registrar** | La función ejecutora realiza solo las acciones permitidas; el responsable de aprobación decide sobre las acciones con consecuencias cuando sea necesario. | Vincule la acción con un destino y una identidad inmutable de la carga útil. Registre fechas y horas, entradas y salidas de las herramientas, cambios de estado, errores y registros de evidencia de los efectos secundarios. | La salida exige un resultado observable o que se preserve la incertidumbre. Un tiempo de espera agotado después de una posible escritura entra en conciliación, no en un reintento sin comprobaciones. |
| **6. Revisar el artefacto** | Una persona revisora identificada aplica criterios de aceptación por escrito. | Compare el resultado con la solicitud, las fuentes, la política, la evidencia y los resultados prohibidos. Registre la identidad y el tipo de quien revisa, la incertidumbre y las limitaciones. | La salida es `ACCEPT`, `REVISE` o `HOLD`. La finalización técnica por sí sola no demuestra utilidad ni corrección. |
| **7. Recuperar o detener** | El responsable de recuperación clasifica el fallo y elige entre reintentar, reparar, compensar, transferir o detener. | Concilie los posibles efectos secundarios, inspeccione el destino exacto, conserve el intento fallido y vincule cualquier sucesor con una nueva identidad de intento. | La salida es `RECOVERED`, un nuevo intento autorizado o una incógnita terminal o detención. Nunca borre el registro del fallo. |
| **8. Cerrar y entregar** | El responsable del resultado acepta el estado final y asigna la siguiente decisión. | Reúna el artefacto aceptado, la evidencia, el veredicto de revisión, las incógnitas restantes y el siguiente responsable. Conserve únicamente la evidencia sujeta a gobernanza. | La salida exige un artefacto vinculado con un registro de evidencia y un siguiente estado explícito. «Terminado» sin un registro de aceptación no cierra el trabajo empresarial. |

El ciclo es secuencial como modelo de responsabilidad, pero la implementación puede volver a etapas anteriores. La nueva evidencia puede devolver un borrador al registro de entradas. Una revisión fallida puede volver a la planificación. Una recuperación puede crear un intento sucesor. El registro debe mostrar ese movimiento en lugar de reescribir el estado anterior.

## Ejemplo práctico: un expediente de investigación de proveedores

Este ejemplo es hipotético. No describe a Toone, la implementación de un cliente ni una ejecución probada de un producto.

Un equipo de compras necesita un expediente de revisión sobre tres posibles proveedores de software. La solicitud se limita a fuentes primarias públicas. El agente puede redactar un único expediente interno. No puede contactar con proveedores, crear cuentas, aceptar condiciones, modificar registros de compras ni publicar el expediente.

### 1. Solicitud delimitada

El Responsable de Operaciones de Compras se hace cargo del resultado. El resultado aceptado es un expediente que incluya la descripción pública actual del producto de cada proveedor, la fuente de precios cuando esté publicada, la documentación sobre el tratamiento de datos, las preguntas sin resolver y las citas. Una recomendación de compra queda fuera del alcance.

Los criterios de aceptación exigen enlaces directos a las fuentes, fechas de observación, separación entre hechos de la fuente y análisis, y un estado de incógnita visible cuando falte evidencia.

### 2. Entradas registradas

El operador registra los tres dominios de los proveedores, sus áreas de documentación pública, la fecha de revisión y los tipos de fuente aprobados. El manifiesto de entradas excluye las reseñas de usuarios, los resúmenes generados sin enlaces a fuentes primarias, los documentos privados y los datos personales.

Cada captura de una fuente recibe una fecha y una referencia estable. Una fuente a la que no se pueda acceder permanece como incógnita sin resolver. El agente no tiene permiso para inventar ni inferir su contenido.

### 3. Mapa de responsabilidades

| Responsabilidad | Responsable hipotético |
|---|---|
| Resultado empresarial | Responsable de Operaciones de Compras |
| Límite de las fuentes | Analista de Compras |
| Investigación y borrador | Agente de Investigación de Proveedores, versión `example-v1` |
| Revisión del artefacto | Analista de Compras |
| Aprobación de comunicaciones externas | Responsable de Operaciones de Compras |
| Fallos y recuperación | Responsable de Sistemas de Compras |

Los nombres describen funciones del ejemplo ficticio. No son funciones de Toone ni evidencia de revisión humana de esta guía.

### 4. Plan delimitado

El agente propone cuatro pasos: recopilar las fuentes aprobadas, extraer hechos fechados, redactar secciones neutrales sobre cada proveedor y reunir el expediente interno. Puede hacer lecturas de páginas web públicas y escribir en un único destino de borrador interno. Se prohíben todas las escrituras externas, los mensajes, los envíos de formularios, las acciones de cuenta y los cambios de registros.

El operador acepta el plan y vincula un destino de salida con la identidad prevista de la carga útil. La aprobación es una decisión del operador. No demuestra que se haya escrito el borrador.

### 5. Ejecución y efecto secundario incierto

La recopilación de fuentes termina y produce un manifiesto de fuentes. El agente propone el expediente y afirma que escribió el borrador. Esa declaración es una **afirmación del agente**.

La herramienta de borradores agota el tiempo de espera después de que el servicio remoto pudiera haber aceptado la solicitud. La respuesta de error es un **hecho de la fuente**. Que el borrador exista o no es una **incógnita sin resolver**. Reintentar de inmediato podría crear un duplicado o sobrescribir un archivo que ya existe.

### 6. La revisión todavía no puede empezar

Quien revisa no tiene un artefacto estable que pueda inspeccionar, por lo que la revisión sigue bloqueada. Una afirmación del agente y un tiempo de espera agotado no satisfacen el registro de evidencia del artefacto.

### 7. Rama de recuperación

El Responsable de Sistemas de Compras comprueba el destino exacto y el hash esperado de la carga útil antes de autorizar cualquier reintento.

1. Si el borrador esperado existe con el hash aprobado, registre `RECOVERED` y no repita la escritura.
2. Si el destino se puede inspeccionar y el borrador no existe, autorice un nuevo intento con un ID de intento nuevo.
3. Si el destino no se puede inspeccionar, registre `WRITE_UNCERTAIN` y deténgase. La falta de evidencia no da permiso para reintentar.

La elección de recuperación es una **decisión del operador**. La observación del destino que la sustenta es un **hecho de la fuente**. La regla que exige conciliar antes de reintentar es una **regla de diseño documentada** en el contrato operativo de este ejemplo.

### 8. Revisión y cierre

Supongamos que el borrador coincidente existe y se recupera. Quien revisa comprueba cada afirmación relevante frente al manifiesto de fuentes, marca una comparación sin sustento para eliminarla y devuelve `REVISE`. El agente produce un borrador sucesor con una nueva suma de comprobación del artefacto. Quien revisa acepta esa versión.

El registro de cierre incluye la suma de comprobación aceptada, el manifiesto de fuentes, la afirmación eliminada, la decisión de quien revisa, las incógnitas restantes y al Responsable de Operaciones de Compras como siguiente responsable. No afirma que los proveedores hayan sido aprobados ni contactados.

## Por qué las escrituras inciertas necesitan una vía de recuperación separada

Reintentar solo es apropiado cuando el fallo y los efectos secundarios permiten repetir la acción de forma segura. La [guía práctica de OpenAI para crear agentes](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) recomienda evaluar el riesgo de las herramientas mediante factores como el acceso de lectura frente al de escritura, la reversibilidad, los permisos y el impacto financiero. También describe la intervención humana para los umbrales de fallo y las acciones de alto riesgo o irreversibles.

NIST AI 600-1 incluye acciones de gobernanza para funciones definidas, supervisión humana, historial de evaluación conservado, desactivación, respuesta a incidentes y alternativas para las dependencias. [NIST describe el Perfil de IA Generativa como una orientación intersectorial voluntaria](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), por lo que esas acciones son orientaciones, no una certificación, una obligación legal ni una prueba del producto.

Ante una escritura incierta, la pregunta operativa no es «¿Puede el agente volver a intentarlo?», sino «¿Puede el responsable establecer si se produjo el primer efecto?». La respuesta determina la rama:

| Estado observado | Registro seguro | Siguiente acción |
|---|---|---|
| El efecto esperado existe y coincide con el destino y la carga útil aprobados | `RECOVERED` | Conserve el efecto y continúe con la revisión sin repetirlo. |
| El destino se puede inspeccionar y el efecto esperado no existe | `RETRY_ELIGIBLE` | Autorice un nuevo intento con una identidad nueva y el mismo alcance o uno revisado. |
| El efecto ocurrió, pero difiere de lo aprobado | `REMEDIATION_REQUIRED` | Detenga el trabajo normal, conserve la evidencia y asigne una reparación o compensación. |
| El destino no se puede inspeccionar o la evidencia es contradictoria | `WRITE_UNCERTAIN` | Deténgase. No reintente hasta que evidencia más sólida resuelva el efecto secundario. |

Esta distinción es pertinente incluso cuando un sistema de ejecución comunica un fallo. Una respuesta fallida puede coexistir con un efecto externo completado.

## Hoja de trabajo del contrato operativo

Use esta hoja antes de asignar a un agente trabajo recurrente o con consecuencias. Mantenga visibles los campos vacíos como trabajo sin resolver.

| Campo | Registro |
|---|---|
| **1. ID de solicitud o trabajo** | Identidad estable que comparten la solicitud, los intentos, los artefactos y los registros de evidencia. |
| **2. Resultado previsto y responsable** | El resultado empresarial, quién lo acepta y qué no autoriza esa aceptación. |
| **3. Tarea y objetivos excluidos** | Trabajo incluido, trabajo excluido, resultados prohibidos y uso indebido previsible. |
| **4. Entradas e identidades de las fuentes** | Responsables de las fuentes, versiones o fechas, límites de vigencia, sumas de comprobación cuando resulten útiles y regla para datos faltantes. |
| **5. Mapa de responsabilidades** | Agente o función del flujo de trabajo, operador, responsable de aprobación, persona revisora, responsable de recuperación y siguiente responsable. |
| **6. Herramientas y datos permitidos** | Alcance de lectura y escritura, destinos permitidos, clases de datos, límite de credenciales y regla de conservación. |
| **7. Acciones prohibidas** | Escrituras externas, mensajes, compras, envíos, cambios de permisos, publicación u otros efectos excluidos. |
| **8. Criterios de entrada y evidencia de salida** | Qué debe cumplirse antes de empezar y qué registro de evidencia demuestra que la etapa puede cerrarse. |
| **9. Identidad de la acción con consecuencias** | Destino exacto, hash inmutable de la carga útil, clase de acción, alcance de la aprobación y vencimiento de la aprobación. |
| **10. Activador y responsable de aprobación** | Qué acción necesita una decisión, quién decide, qué evidencia inspecciona y cómo se registra la decisión. |
| **11. Registro de ejecución y efectos secundarios** | ID del intento, fechas y horas, resultado de la herramienta, observación del destino, suma de comprobación del artefacto y cualquier evidencia contradictoria. |
| **12. Registro de revisión** | Criterios de aceptación, identidad y tipo de quien revisa, evidencia comprobada, veredicto, incertidumbre y limitaciones. |
| **13. Fallo y recuperación** | Clases de fallo, posibilidad de reintento, límite de intentos, método de conciliación, responsable de recuperación y vía de compensación. |
| **14. Incógnitas y retirada** | Hechos sin resolver, evidencia conservada, condición de detención, regla de desactivación y fecha de revisión. |
| **15. Siguiente acción y estado terminal** | Artefacto aceptado, siguiente responsable, siguiente decisión y si el trabajo está aceptado, revisado, retenido, detenido o retirado. |

### Versión compacta para copiar

```text
ID del trabajo:
Responsable del resultado:
Resultado:
Límite de la tarea:
Objetivos excluidos:
Entradas y versiones de las fuentes:
Agente o función del flujo de trabajo:
Operador:
Persona revisora y tipo de revisión:
Responsable de recuperación:
Herramientas y datos permitidos:
Acciones prohibidas:
Criterios de entrada:
Evidencia de salida:
Destino e identidad de la carga útil:
Activador y responsable de aprobación:
Registro de ejecución:
Criterios y veredicto de revisión:
Clases de fallo:
Método de conciliación:
Límite de reintentos:
Incógnitas:
Condición de detención o retirada:
Siguiente acción y responsable:
```

## Condiciones de detención

Detenga el trabajo o transfiera el control cuando se cumpla alguna de estas condiciones:

- una acción de alto riesgo, sensible o irreversible necesita la aprobación de una persona responsable;
- la tarea sale de su alcance aceptado o necesita una herramienta, fuente, destino o permiso no aprobado;
- se alcanza el umbral de fallos o el límite de reintentos;
- no se puede conciliar un posible efecto secundario externo;
- falta evidencia imprescindible, está desactualizada o es contradictoria, o no se puede vincular con el artefacto;
- la persona revisora o el responsable de recuperación no está disponible;
- el resultado incumple una condición de aceptación obligatoria;
- un flujo de trabajo determinista puede realizar el trabajo de forma más predecible y con menos criterio;
- el valor esperado ya no justifica el costo, la demora o el riesgo;
- las cuestiones de política, legales, de privacidad, seguridad o del ámbito especializado requieren un responsable cualificado fuera de la autoridad del agente.

Detenerse es un resultado válido cuando conserva la evidencia e identifica al siguiente responsable. Continuar sin autoridad no es progreso.

## Un contrato organizativo documentado es evidencia de diseño

La organización SEO Growth inspeccionada ofrece un ejemplo de diseño operativo documentado. Su manual y sus registros de rutinas asignan responsables de etapas, entradas, decisiones, salidas, bloqueos, estados de devolución de llamada, sumas de comprobación y registros de evidencia. El contrato documentado también reserva las acciones externas con consecuencias para un paso de aprobación en vivo.

Esos registros muestran lo que la organización diseñó y registró. No demuestran que Toone Desktop aplicara el contrato, ejecutara cada etapa, conservara un historial completo, se recuperara automáticamente ni produjera un resultado empresarial. Este artículo los usa únicamente para ilustrar la diferencia entre una **regla de diseño documentada** y un **hecho de la fuente**.

## Elija al siguiente responsable según la pregunta pendiente

Si la pregunta sin resolver es quién puede aprobar una acción o aceptar el riesgo residual, consulte [Gobernanza de agentes de IA (en inglés)](/en/governance). Si el equipo necesita primero contexto sobre la categoría, lea la [Guía de empresas nativas de IA (en inglés)](/en/guides/ai-native-company). Use los [casos documentados (en inglés)](/en/showcases) solo como prueba de lo que esas páginas documenten.

Los responsables de conceptos relacionados con el conocimiento organizativo, las organizaciones de agentes, las rutinas, la evaluación y la observabilidad deben enlazarse aquí cuando sus rutas canónicas estén publicadas. Este borrador no trata las rutas planificadas como prueba vigente.

## Acerca de esta guía

**Quién:** Toone Content es el autor organizativo y Hexagonal.io es el editor. El agente Content Editor es la función responsable de la revisión editorial de este borrador. No se afirma que haya revisión humana, de producto, ingeniería, seguridad, privacidad, legal ni de especialistas en la materia.

**Cómo:** La guía se preparó a partir de un brief aprobado en G1 y un expediente de afirmaciones y fuentes fijado mediante suma de comprobación. La asistencia automatizada ayudó a recopilar, organizar y sintetizar orientaciones primarias actuales de Microsoft, OpenAI, Anthropic y NIST. Las cinco categorías de evidencia, el ciclo de ocho etapas, el ejemplo de fallo y la hoja de trabajo son una síntesis editorial. El ejemplo de investigación de proveedores es ficticio. El artículo no se basa en pruebas del producto Toone, implementaciones de clientes, estudios de rendimiento ni comparativas de referencia.

**Por qué:** La guía busca ayudar a operadores y responsables de equipos a hacer que el trabajo de los agentes sea inspeccionable desde la solicitud hasta la revisión, con autoridad, evidencia, fallos, recuperación y estados de salida claros.

**Límites y correcciones:** Las necesidades operativas varían según la tarea, el riesgo, la jurisdicción y el sistema. El trabajo legal, regulado, sensible para la seguridad, de privacidad, de seguridad y de alto impacto requiere una revisión cualificada que va más allá de este modelo editorial. Consulte la [política editorial, de fuentes y correcciones (en inglés)](/en/editorial-policy). Use la [página de contacto de Toone (en inglés)](/en/contact) para consultas generales. Envíe las correcciones con la URL afectada y la evidencia de respaldo a [hello@trytoone.com](mailto:hello@trytoone.com). Las correcciones sustanciales deben actualizar la fecha de la fuente e invalidar las versiones dependientes en otros idiomas hasta que se revisen.

## Fuentes primarias

- [Microsoft Learn: Plan empresarial para agentes de IA](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan), actualizado el 2026-04-10.
- [OpenAI: Guía práctica para crear agentes](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), consultado el 2026-08-13.
- [Anthropic: Creación de agentes eficaces](https://www.anthropic.com/engineering/building-effective-agents), publicado el 2024-12-19.
- [NIST AI 600-1: Marco de Gestión de Riesgos de la Inteligencia Artificial, Perfil de Inteligencia Artificial Generativa](https://doi.org/10.6028/NIST.AI.600-1), publicado el 2024-07-26.
