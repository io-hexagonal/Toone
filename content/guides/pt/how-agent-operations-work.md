---
locale: "pt"
slug: "how-agent-operations-work"
canonicalPath: "/guides/how-agent-operations-work"
title: "Como funcionam as operações de agentes: do pedido ao artefacto revisto"
heading: "Como funcionam as operações de agentes: do pedido ao artefacto revisto"
description: "Siga um ciclo operacional do agente em oito etapas que atribui responsáveis, delimita ferramentas, regista evidência, trata efeitos incertos e termina com uma revisão."
eyebrow: "Guia de operações de agentes"
author: "Toone Content"
authorType: "Organization"
authorUrl: "/en/editorial-policy"
published: "2026-08-14"
updated: "2026-08-14"
readTime: "17 min de leitura"
featured: true
image: "/assets/og/toone-og.png"
imageAlt: "Guia da Toone sobre operações de agentes"
sourceWorkId: "CNT-editorial-post-a44edaec"
sourceSha256: "8804e446ec0f53f388cfb334b0e889f38fb50b367c35ceb181322aede6a18c50"
englishSourceSha256: "374faf21eaf71d93e2efb73c4427942b8940affd2ecbe290eaf98a9d2643082a"
translationManifestSha256: "fd5ea2d9ce3434b9a3f81d95a4346d61e82683ee97e4dabbc9ddfe3155c43bbd"
translationQaSha256: "732fb2e5e17a51248f505b9ade3cba67a86987ae6161b1138e338faac1455655"
---
Um ciclo operacional do agente é um percurso controlado desde um pedido delimitado até um artefacto revisto. O ciclo atribui responsabilidades, regista as entradas, limita as ferramentas e os dados, regista ações e evidência, verifica o resultado, trata falhas e termina num estado explícito de aceitação, revisão ou interrupção.

Esta é a definição de trabalho usada no guia. Combina orientações atuais de fornecedores e de gestão do risco com um contrato operacional prático. Não é uma norma universal nem a descrição de um produto específico.

O ciclo é relevante porque a afirmação de um agente de que concluiu o trabalho constitui apenas um tipo de evidência. Um registo operacional útil separa o que uma fonte ou sistema observou, o que um desenho exige, o que o agente afirma, o que um operador responsável decidiu e o que continua por apurar.

## Comece por decidir se o trabalho precisa de um agente

Não comece por uma ferramenta. Comece pelo trabalho, pelo responsável pela decisão e pela evidência necessária no final.

As [orientações da Microsoft para o planeamento empresarial de agentes de IA](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan) distinguem entre trabalho previsível que pode usar código convencional, tarefas de recuperação estática de informação e trabalho que precisa de raciocínio dinâmico ou utilização de ferramentas. O [guia da Anthropic para criar agentes eficazes](https://www.anthropic.com/engineering/building-effective-agents) também separa fluxos de trabalho predefinidos de agentes que dirigem o seu próprio processo e a utilização de ferramentas, e recomenda o desenho menos complexo que seja adequado à tarefa. São apoios à decisão, não leis técnicas rígidas.

Use um programa determinístico ou um fluxo de trabalho predefinido quando as regras, a ordem das etapas, as entradas e o resultado esperado forem estáveis e testáveis. Use recuperação de informação quando o trabalho consistir em encontrar informação fundamentada num conjunto conhecido de documentos, sem sequenciação dinâmica de ferramentas. Mantenha o fluxo sob responsabilidade humana quando o ato central for uma decisão de política, responsabilidade, gosto ou aceitação e a execução dinâmica acrescentar pouco.

Um agente torna-se uma opção razoável quando o trabalho exige decisões contextuais sobre entradas não estruturadas, sequências variáveis de ferramentas ou exceções, e quando a organização ainda consegue definir:

- o resultado e o responsável por ele;
- as entradas, ferramentas, dados e destinos permitidos;
- as ações proibidas e os pontos de aprovação;
- a evidência que outro revisor pode inspecionar;
- um responsável pela recuperação e um estado de paragem seguro;
- um teste de aceitação para o artefacto final.

Se estes campos não puderem ser preenchidos, acrescentar um agente torna a incerteza mais difícil de ver.

## Use cinco categorias de evidência

Estas categorias impedem que a narração de um agente seja tratada como prova. Constituem o modelo editorial deste guia.

| Categoria de evidência | Significado | O que pode sustentar | O que não pode sustentar |
|---|---|---|---|
| **Facto da fonte** | Um documento primário com data e hora, uma resposta do sistema responsável ou um efeito observado de forma independente. | Que o facto indicado foi observado dentro do âmbito registado da fonte. | Que existe completude além desse âmbito ou um efeito secundário que não foi observado. |
| **Regra de desenho documentada** | Um contrato operacional versionado diz que deve existir uma função, etapa, aprovação, comprovativo ou regra de recuperação. | Que a organização desenhou e registou a regra. | Que o software a aplicou ou que todas as execuções a seguiram. |
| **Afirmação do agente** | Um agente declara uma intenção, interpretação, resultado ou causa. | Uma hipótese ou um resultado proposto para revisão. | A execução, a correção, a aprovação ou a conclusão do trabalho de negócio. |
| **Decisão do operador** | Uma pessoa responsável ou um sistema autorizado aprova, rejeita, aceita, interrompe ou escolhe um percurso de recuperação. | Que a decisão é conhecida quando o responsável, o âmbito, a evidência, o destino e o momento estão vinculados. | Que a ação aprovada ocorreu ou foi bem-sucedida. |
| **Incógnita não resolvida** | A evidência disponível não permite determinar o que aconteceu ou se o resultado é válido. | Um motivo para parar, reconciliar ou recolher evidência mais forte. | Permissão para adivinhar, repetir ou declarar sucesso. |

Um acontecimento pode envolver várias categorias. Um agente pode propor a escrita de um ficheiro, um operador pode aprovar um destino e uma soma de verificação, e o sistema de destino pode confirmar depois a escrita. Estes elementos são, respetivamente, uma afirmação do agente, uma decisão do operador e um facto da fonte. Resumi-los como «o agente concluiu o trabalho» esconde as distinções de que um revisor precisa.

## O ciclo operacional em oito etapas

Cada etapa deve tornar visíveis o responsável, a entrada, o âmbito permitido, a ação, a decisão, o resultado, o comprovativo, o estado de falha, o responsável pela recuperação e a condição de saída pertinentes nesse ponto. Os campos abaixo formam um contrato operacional único, sem alegar que todas as implementações usam os mesmos nomes.

| Etapa | Responsabilidade e decisão | Entrada, ferramentas, ação e transferência | Resultado, evidência, falha, recuperação e saída |
|---:|---|---|---|
| **1. Delimitar o pedido** | Um responsável pelo resultado define o resultado de negócio e decide se o pedido é aceite. | Registe o ID do trabalho, a tarefa, o público, os objetivos excluídos, o limite de risco e os critérios de aceitação. Ainda não é necessária qualquer ferramenta de execução. | A saída exige um âmbito aceite. Uma responsabilidade ambígua ou objetivos contraditórios devolvem o trabalho ao responsável pelo pedido. |
| **2. Registar as entradas** | Um responsável pelas fontes ou um operador confirma a evidência que pode entrar no trabalho. | Registe as identidades das fontes, datas ou versões, somas de verificação quando forem úteis, limites de atualidade e regras para dados em falta. Transfira um manifesto imutável das entradas. | A saída exige um comprovativo das entradas e incógnitas explícitas. A falta de evidência essencial interrompe ou restringe o trabalho. |
| **3. Atribuir responsabilidades** | O responsável pelo resultado nomeia o agente ou a função do fluxo de trabalho, o operador, o revisor, o responsável pelas aprovações e o responsável pela recuperação. | Mapeie quem pode propor, executar, aprovar, rever, repetir e interromper. Registe conflitos e funções indisponíveis. | A saída exige um mapa de responsabilidades. Uma decisão sem responsável continua a ser um bloqueio. |
| **4. Planear dentro do âmbito** | O operador ou o responsável pela política decide se o percurso proposto permanece dentro do contrato. | Registe as etapas, as ferramentas e os dados permitidos, o âmbito do destino, as ações proibidas, os acionadores de aprovação, o orçamento e os limites de repetição. Transfira um plano que possa ser revisto ou uma instrução determinística. | A saída exige um plano aceite. Uma ampliação do âmbito regressa ao responsável pela decisão, em vez de ser inferida. |
| **5. Executar e registar** | A função de execução realiza apenas as ações permitidas; o responsável pelas aprovações decide sobre ações com consequências quando necessário. | Vincule a ação a um destino e a uma identidade imutável do conteúdo. Registe datas e horas, entradas e resultados das ferramentas, alterações de estado, erros e comprovativos dos efeitos secundários. | A saída exige um resultado observável ou a preservação da incerteza. Um tempo limite depois de uma possível escrita entra em reconciliação, não numa repetição sem verificação. |
| **6. Rever o artefacto** | Um revisor identificado aplica critérios de aceitação escritos. | Compare o resultado com o pedido, as fontes, a política, a evidência e os resultados proibidos. Registe a identidade e o tipo de revisor, a incerteza e as limitações. | A saída é `ACCEPT`, `REVISE` ou `HOLD`. A conclusão técnica, por si só, não prova utilidade nem correção. |
| **7. Recuperar ou parar** | O responsável pela recuperação classifica a falha e escolhe entre repetir, reparar, compensar, transferir ou parar. | Reconcilie possíveis efeitos secundários, inspecione o destino exato, preserve a tentativa falhada e vincule qualquer sucessora a uma nova identidade de tentativa. | A saída é `RECOVERED`, uma nova tentativa autorizada ou uma incógnita terminal ou paragem. Nunca apague o registo da falha. |
| **8. Encerrar e transferir** | O responsável pelo resultado aceita o estado final e atribui a decisão seguinte. | Reúna o artefacto aceite, a evidência, o veredicto da revisão, as incógnitas restantes e o responsável seguinte. Conserve apenas evidência sujeita a regras de governação. | A saída exige um artefacto vinculado a um comprovativo e um estado seguinte explícito. «Concluído» sem registo de aceitação não encerra o trabalho de negócio. |

O ciclo é sequencial enquanto modelo de responsabilidade, mas a implementação pode regressar a etapas anteriores. Nova evidência pode devolver um rascunho ao registo de entradas. Uma revisão falhada pode regressar ao planeamento. Uma recuperação pode criar uma tentativa sucessora. O registo deve mostrar esse movimento, em vez de reescrever o estado anterior.

## Exemplo prático: um dossiê de pesquisa de fornecedores

Este exemplo é hipotético. Não descreve a Toone, a implementação de um cliente nem uma execução testada de um produto.

Uma equipa de compras precisa de um dossiê de revisão sobre três potenciais fornecedores de software. O pedido está limitado a fontes primárias públicas. O agente pode preparar um dossiê interno. Não pode contactar fornecedores, criar contas, aceitar termos, alterar registos de compras nem publicar o dossiê.

### 1. Pedido delimitado

O Responsável pelas Operações de Compras responde pelo resultado. O resultado aceite é um dossiê que contenha a descrição pública atual do produto de cada fornecedor, a fonte de preços quando publicada, documentação sobre o tratamento de dados, perguntas não resolvidas e citações. Uma recomendação de compra fica fora do âmbito.

Os critérios de aceitação exigem ligações diretas para as fontes, datas de observação, a separação entre factos da fonte e análise, e um estado de incógnita visível quando faltar evidência.

### 2. Entradas registadas

O operador regista os três domínios dos fornecedores, as respetivas áreas de documentação pública, a data da revisão e os tipos de fonte aprovados. O manifesto das entradas exclui avaliações de utilizadores, resumos gerados sem ligações para fontes primárias, documentos privados e dados pessoais.

Cada captura de uma fonte recebe uma data e uma referência estável. Uma fonte a que não seja possível aceder permanece uma incógnita não resolvida. O agente não tem autorização para inventar ou inferir o seu conteúdo.

### 3. Mapa de responsabilidades

| Responsabilidade | Responsável hipotético |
|---|---|
| Resultado de negócio | Responsável pelas Operações de Compras |
| Limite das fontes | Analista de Compras |
| Pesquisa e rascunho | Agente de Pesquisa de Fornecedores, versão `example-v1` |
| Revisão do artefacto | Analista de Compras |
| Aprovação de comunicações externas | Responsável pelas Operações de Compras |
| Falha e recuperação | Responsável pelos Sistemas de Compras |

Os nomes descrevem funções do exemplo fictício. Não são funções da Toone nem evidência de revisão humana deste guia.

### 4. Plano delimitado

O agente propõe quatro etapas: recolher fontes aprovadas, extrair factos datados, redigir secções neutras sobre cada fornecedor e compor o dossiê interno. Pode fazer leituras na Web pública e escrever num único destino de rascunho interno. São proibidas todas as escritas externas, mensagens, submissões de formulários, ações em contas ou alterações de registos.

O operador aceita o plano e vincula-o a um destino de saída e à identidade prevista do conteúdo. A aprovação é uma decisão do operador. Não constitui prova de que o rascunho foi escrito.

### 5. Execução e efeito secundário incerto

A recolha de fontes termina e produz um manifesto de fontes. O agente propõe o dossiê e afirma que escreveu o rascunho. Essa declaração é uma **afirmação do agente**.

A ferramenta de rascunho devolve um tempo limite depois de o serviço remoto poder ter aceite o pedido. A resposta de erro é um **facto da fonte**. A existência do rascunho é uma **incógnita não resolvida**. Repetir imediatamente pode criar um duplicado ou substituir um ficheiro que já existe.

### 6. A revisão ainda não pode começar

O revisor não tem um artefacto estável para inspecionar, pelo que a revisão continua bloqueada. Uma afirmação do agente e um tempo limite não satisfazem o comprovativo do artefacto.

### 7. Percurso de recuperação

O Responsável pelos Sistemas de Compras verifica o destino exato e o hash esperado do conteúdo antes de autorizar qualquer repetição.

1. Se o rascunho esperado existir com o hash aprovado, registe `RECOVERED` e não repita a escrita.
2. Se o destino puder ser inspecionado e o rascunho estiver ausente, autorize uma nova tentativa com um novo ID de tentativa.
3. Se o destino não puder ser inspecionado, registe `WRITE_UNCERTAIN` e pare. A falta de evidência não é uma autorização para repetir.

A escolha da recuperação é uma **decisão do operador**. A observação do destino que a sustenta é um **facto da fonte**. A regra que exige reconciliação antes de uma repetição é uma **regra de desenho documentada** no contrato operacional deste exemplo.

### 8. Revisão e encerramento

Suponha que o rascunho correspondente existe e é recuperado. O revisor verifica cada alegação material face ao manifesto de fontes, assinala uma comparação não sustentada para remoção e devolve `REVISE`. O agente produz um rascunho sucessor com uma nova soma de verificação do artefacto. O revisor aceita essa versão.

O comprovativo de encerramento regista a soma de verificação aceite, o manifesto de fontes, a alegação removida, a decisão do revisor, as incógnitas restantes e o Responsável pelas Operações de Compras como responsável seguinte. Não afirma que os fornecedores foram aprovados ou contactados.

## Por que motivo as escritas incertas precisam de um percurso de recuperação próprio

Uma repetição só é adequada quando a falha e os efeitos secundários tornam seguro repetir a ação. O [guia prático da OpenAI para criar agentes](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) recomenda avaliar o risco das ferramentas com fatores como acesso de leitura ou escrita, reversibilidade, permissões e impacto financeiro. Também descreve a intervenção humana para limiares de falha e ações de alto risco ou irreversíveis.

O NIST AI 600-1 inclui ações de governação para funções definidas, supervisão humana, conservação do histórico de avaliação, desativação, resposta a incidentes e alternativas para dependências. O [NIST descreve o Perfil de IA Generativa como orientação intersetorial voluntária](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), pelo que essas ações são orientações, e não uma certificação, um requisito legal ou prova de um produto.

Perante uma escrita incerta, a pergunta operacional não é «O agente pode tentar de novo?». É «O responsável pode determinar se o primeiro efeito aconteceu?». A resposta determina o percurso:

| Estado observado | Registo seguro | Ação seguinte |
|---|---|---|
| O efeito esperado existe e corresponde ao destino e ao conteúdo aprovados | `RECOVERED` | Manter o efeito e continuar a revisão sem o repetir. |
| O destino pode ser inspecionado e o efeito esperado está ausente | `RETRY_ELIGIBLE` | Autorizar uma nova tentativa com uma nova identidade e o mesmo âmbito ou um âmbito revisto. |
| O efeito ocorreu, mas difere da aprovação | `REMEDIATION_REQUIRED` | Parar o trabalho normal, preservar a evidência e atribuir a reparação ou compensação. |
| O destino não pode ser inspecionado ou a evidência é contraditória | `WRITE_UNCERTAIN` | Parar. Não repetir até que evidência mais forte esclareça o efeito secundário. |

Esta distinção é importante mesmo quando um sistema de execução comunica uma falha. Uma resposta falhada pode coexistir com um efeito externo concluído.

## Ficha de trabalho do contrato operacional

Use esta ficha antes de atribuir trabalho recorrente ou com consequências a um agente. Mantenha os campos vazios visíveis como trabalho por resolver.

| Campo | Registo |
|---|---|
| **1. ID do pedido ou trabalho** | Identidade estável partilhada pelo pedido, pelas tentativas, pelos artefactos e pelos comprovativos. |
| **2. Resultado pretendido e responsável** | O resultado de negócio, quem o aceita e o que essa aceitação não autoriza. |
| **3. Tarefa e objetivos excluídos** | Trabalho incluído e excluído, resultados proibidos e utilização indevida previsível. |
| **4. Entradas e identidades das fontes** | Responsáveis pelas fontes, versões ou datas, limites de atualidade, somas de verificação quando forem úteis e regra para dados em falta. |
| **5. Mapa de responsabilidades** | Agente ou função do fluxo de trabalho, operador, responsável pela aprovação, revisor, responsável pela recuperação e responsável seguinte. |
| **6. Ferramentas e dados permitidos** | Âmbito de leitura e escrita, destinos permitidos, classes de dados, limite de credenciais e regra de conservação. |
| **7. Ações proibidas** | Escritas externas, mensagens, compras, submissões, alterações de permissões, publicação ou outros efeitos excluídos. |
| **8. Critérios de entrada e evidência de saída** | O que tem de ser verdade antes de o trabalho começar e que comprovativo demonstra que a etapa pode terminar. |
| **9. Identidade da ação com consequências** | Destino exato, hash imutável do conteúdo, classe da ação, âmbito da aprovação e validade da aprovação. |
| **10. Acionador e responsável pela aprovação** | Que ação precisa de uma decisão, quem decide, que evidência inspeciona e como a decisão é registada. |
| **11. Comprovativo da execução e do efeito secundário** | ID da tentativa, datas e horas, resultado da ferramenta, observação do destino, soma de verificação do artefacto e qualquer evidência contraditória. |
| **12. Registo da revisão** | Critérios de aceitação, identidade e tipo do revisor, evidência verificada, veredicto, incerteza e limitações. |
| **13. Falha e recuperação** | Classes de falha, elegibilidade para repetição, limite de tentativas, método de reconciliação, responsável pela recuperação e percurso de compensação. |
| **14. Incógnitas e desativação** | Factos não resolvidos, evidência conservada, condição de paragem, regra de desativação e data da revisão. |
| **15. Ação seguinte e estado terminal** | Artefacto aceite, responsável seguinte, decisão seguinte e indicação de que o trabalho foi aceite, revisto, retido, interrompido ou desativado. |

### Versão compacta para copiar

```text
ID do trabalho:
Responsável pelo resultado:
Resultado:
Limite da tarefa:
Objetivos excluídos:
Entradas e versões das fontes:
Agente ou função do fluxo de trabalho:
Operador:
Revisor e tipo de revisor:
Responsável pela recuperação:
Ferramentas e dados permitidos:
Ações proibidas:
Critérios de entrada:
Evidência de saída:
Destino e identidade do conteúdo:
Acionador e responsável pela aprovação:
Comprovativo da execução:
Critérios e veredicto da revisão:
Classes de falha:
Método de reconciliação:
Limite de tentativas:
Incógnitas:
Condição de paragem ou desativação:
Ação e responsável seguintes:
```

## Condições de paragem

Pare ou transfira o controlo quando se verificar uma destas condições:

- uma ação de alto risco, sensível ou irreversível exige uma aprovação responsável;
- a tarefa sai do âmbito aceite ou precisa de uma ferramenta, fonte, destino ou permissão não aprovada;
- é atingido o limiar de falha ou o limite de tentativas;
- um possível efeito secundário externo não pode ser reconciliado;
- falta evidência essencial, está desatualizada ou é contraditória, ou não pode ser associada ao artefacto;
- o revisor ou o responsável pela recuperação não está disponível;
- o resultado falha uma condição de aceitação obrigatória;
- um fluxo determinístico consegue executar o trabalho de forma mais previsível e com menos necessidade de avaliação;
- o valor esperado já não justifica o custo, o atraso ou o risco;
- questões de política, jurídicas, de privacidade, segurança ou do domínio exigem um responsável qualificado que esteja fora da autoridade do agente.

Uma paragem é um resultado válido quando preserva a evidência e identifica o responsável seguinte. Continuar sem autoridade não é progresso.

## Um contrato organizacional documentado é evidência de desenho

A organização SEO Growth inspecionada fornece um exemplo de desenho operacional documentado. O seu manual e os registos das rotinas atribuem responsáveis pelas etapas, entradas, decisões, resultados, bloqueios, estados de callback, somas de verificação e comprovativos. O contrato documentado também reserva ações externas com consequências para uma etapa de aprovação em direto.

Esses registos mostram o que a organização desenhou e registou. Não demonstram que o Toone Desktop aplicou o contrato, executou todas as etapas, conservou um histórico completo, recuperou automaticamente ou produziu um resultado de negócio. Este artigo usa-os apenas para ilustrar a diferença entre uma **regra de desenho documentada** e um **facto da fonte**.

## Escolha o responsável seguinte de acordo com a questão ainda por resolver

Se a questão não resolvida for quem pode aprovar uma ação ou aceitar risco residual, continue para [governação de agentes de IA, em inglês](/en/governance). Se a equipa precisar primeiro de contexto sobre a categoria, leia o [guia da empresa nativa de IA, em inglês](/en/guides/ai-native-company). Use as [demonstrações, em inglês](/en/showcases) apenas para provas documentadas nessas páginas.

Os responsáveis por conceitos relacionados com conhecimento organizacional, organizações de agentes, rotinas, avaliação e observabilidade devem ser ligados aqui quando os respetivos URL canónicos estiverem ativos. Este rascunho não trata rotas planeadas como prova atual.

## Sobre este guia

**Quem:** Toone Content é o autor organizacional e Hexagonal.io é o editor. O agente Content Editor é o responsável pela revisão editorial deste rascunho. Não se alega qualquer revisão humana, pelo proprietário do domínio, de produto, engenharia, segurança, privacidade, jurídica ou por especialista na matéria.

**Como:** O guia foi preparado a partir de um briefing aprovado no G1 e de um dossiê de alegações e fontes fixado por soma de verificação. A assistência automatizada ajudou a recolher, organizar e sintetizar orientações primárias atuais da Microsoft, OpenAI, Anthropic e do NIST. As cinco categorias de evidência, o ciclo em oito etapas, o exemplo de falha e a ficha de trabalho são sínteses editoriais. O exemplo da pesquisa de fornecedores é fictício. O artigo não se baseia em qualquer teste de produto da Toone, implementação de cliente, estudo de desempenho ou benchmark.

**Porquê:** O guia destina-se a ajudar operadores e responsáveis de equipa a tornar o trabalho de agentes inspecionável desde o pedido até à revisão, com estados claros de autoridade, evidência, falha, recuperação e saída.

**Limites e correções:** As necessidades operacionais variam de acordo com a tarefa, o risco, a jurisdição e o sistema. Trabalho jurídico, regulado, sensível à segurança, relacionado com privacidade ou segurança, ou com outro impacto elevado exige revisão qualificada para além deste modelo editorial. Consulte a [política editorial, de fontes e correções, em inglês](/en/editorial-policy). Para perguntas gerais, use a [página de contacto da Toone, em inglês](/en/contact). Envie correções com o URL afetado e evidência de suporte para [hello@trytoone.com](mailto:hello@trytoone.com). As correções materiais devem atualizar a data da fonte e invalidar as versões dependentes noutras línguas até a revisão estar concluída.

## Fontes primárias

- [Microsoft Learn: Plano empresarial para agentes de IA](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/business-strategy-plan), atualizado em 2026-04-10.
- [OpenAI: Guia prático para criar agentes](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), consultado em 2026-08-13.
- [Anthropic: Criar agentes eficazes](https://www.anthropic.com/engineering/building-effective-agents), publicado em 2024-12-19.
- [NIST AI 600-1: Estrutura de Gestão do Risco de Inteligência Artificial, Perfil de Inteligência Artificial Generativa](https://doi.org/10.6028/NIST.AI.600-1), publicado em 2024-07-26.
