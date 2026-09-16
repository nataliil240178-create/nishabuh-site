
  (function () {
    'use strict';

    var CRITERIA = [
      { k: 'demand', label: 'Спрос' },
      { k: 'competition', label: 'Конкуренция' },
      { k: 'check', label: 'Чек' },
      { k: 'recurring', label: 'Повторяемость' },
      { k: 'entry', label: 'Лёгкий вход' },
      { k: 'remote', label: 'Удалёнка' }
    ];
    var DEFAULT_W = { demand: 30, competition: 15, check: 25, recurring: 20, entry: 5, remote: 5 };
    var W = { demand: 30, competition: 15, check: 25, recurring: 20, entry: 5, remote: 5 };

    var PRESETS = {
      income:  { demand: 20, competition: 10, check: 35, recurring: 35, entry: 0,  remote: 0 },
      fast:    { demand: 35, competition: 20, check: 10, recurring: 10, entry: 20, remote: 5 },
      lowcomp: { demand: 20, competition: 40, check: 20, recurring: 10, entry: 5,  remote: 5 },
      remote:  { demand: 25, competition: 15, check: 15, recurring: 20, entry: 10, remote: 40 }
    };
    var TIER_LABEL = { ok: 'сильная ниша', mid: 'рабочая ниша', low: 'на вырост' };

    var store = {
      get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* приватный режим — просто не сохраняем */ } }
    };
    var WEIGHTS_KEY = 'nishabuh-weights-v5';
    var PLAN_KEY = 'nishabuh-plan-v5';

    var NICHES = [
      {
        id: 'marketplaces',
        name: 'Селлеры маркетплейсов (WB, Ozon)',
        sphere: 'Маркетплейсы',
        types: ['ip'],
        clientDesc: 'Селлеры с оборотом от 300 тыс. ₽/мес, команда 1–10 человек',
        s: { demand: 5, competition: 2, check: 3, recurring: 5, entry: 4, remote: 5 },
        q1: 'бухгалтер маркетплейс',
        demand: { wordstat: 14800, trend: 22, hhVacancies: 260, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера для маркетплейсов',
        pains: ['ЕНС и налоги при росте оборота', 'сверка комиссий и рекламы с отчётами площадок', 'возвраты, недостачи, штрафы площадок'],
        services: [
          ['Аудит учёта и налогов селлера', '5 000–10 000 ₽'],
          ['Ведение УСН + ежемесячная сверка с площадками', 'от 15 000 ₽/мес'],
          ['Автоматизация учёта (МойСклад, SelSup)', 'от 30 000 ₽']
        ],
        lead: 'Чек-лист: 7 ошибок селлера на ЕНС, которые стоят денег',
        channels: ['Чаты селлеров WB и Ozon', 'Telegram-каналы про маркетплейсы', 'Партнёрки фулфилментов и банков'],
        hook: 'Бухгалтерия для селлеров WB и Ozon: сверим комиссии до копейки и снимем вопросы по ЕНС',
        offer: 'Проведу аудит учёта селлера: сверю комиссии, рекламу и штрафы с отчётами площадок, покажу, где вы теряете деньги, — дальше решаете сами.',
        note: 'Самая горячая ниша, но и конкуренция высокая — берите узкий сегмент: крупные селлеры или одна категория товаров.'
      },
      {
        id: 'schools',
        name: 'Онлайн-школы и эксперты',
        sphere: 'Образование',
        types: ['ip'],
        clientDesc: 'Эксперты и школы с выручкой от 500 тыс. ₽/мес',
        s: { demand: 4, competition: 2, check: 4, recurring: 4, entry: 4, remote: 5 },
        q1: 'бухгалтер для онлайн-школы',
        demand: { wordstat: 5200, trend: 14, hhVacancies: 90, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера для онлайн школы',
        pains: ['агентские договоры с самозанятыми', 'роялти и права на курсы', 'возвраты оплат учеников'],
        services: [
          ['Аудит договоров и налогов школы', '7 000–15 000 ₽'],
          ['Ведение ИП/ООО школы', 'от 20 000 ₽/мес'],
          ['Постановка учёта выплат самозанятым', 'от 25 000 ₽']
        ],
        lead: 'Памятка: как онлайн-школе платить самозанятым и не терять вычеты',
        channels: ['Telegram-чаты продюсеров', 'Сообщества экспертов и спикеров', 'Партнёрки платформ курсов (GetCourse)'],
        hook: 'Бухгалтерия онлайн-школ: самозанятые, роялти и возвраты — без авралов перед отчётностью',
        offer: 'Наведу порядок в договорах и выплатах онлайн-школы: самозанятые, роялти, возвраты — за неделю подготовлю школу к спокойной отчётности.',
        note: 'Клиенты далеки от учёта — ваш экспертный язык сам по себе продаёт.'
      },
      {
        id: 'clinics',
        name: 'Медцентры и стоматологии',
        sphere: 'Медицина',
        types: ['ooo'],
        clientDesc: 'Частные клиники, 5–50 сотрудников',
        s: { demand: 3, competition: 3, check: 5, recurring: 5, entry: 2, remote: 3 },
        q1: 'бухгалтер для стоматологии',
        demand: { wordstat: 3400, trend: 6, hhVacancies: 140, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера в клинику',
        pains: ['лицензии и проверки Росздравнадзора', 'учёт медикаментов и материалов', 'зарплаты врачей со ставками и категориями'],
        services: [
          ['Аудит учёта клиники', '15 000–30 000 ₽'],
          ['Ведение ООО клиники (УСН/ОСНО)', 'от 40 000 ₽/мес'],
          ['Постановка учёта медикаментов', 'от 50 000 ₽']
        ],
        lead: 'Чек-лист готовности клиники к проверке',
        channels: ['Сообщества главных врачей и владельцев клиник', '1С-франчайзи с медицинскими клиентами', 'Управляющие медцентров'],
        hook: 'Бухгалтерия клиники: медикаменты, ставки врачей, проверки — под контролем',
        offer: 'Возьму учёт клиники на себя: медикаменты, ставки врачей, проверки — вы занимаетесь пациентами, я отвечаю за цифры.',
        note: 'Высокие чеки и вечные абонементы, но нужен глубокий вход — стартуйте с малых форматов: кабинеты, лаборатории, косметология с лицензией.'
      },
      {
        id: 'it',
        name: 'IT-аутсорс и студии',
        sphere: 'IT',
        types: ['ooo'],
        clientDesc: 'Студии разработки и агентства, 3–30 человек',
        s: { demand: 4, competition: 3, check: 4, recurring: 4, entry: 3, remote: 5 },
        q1: 'бухгалтер в it компании',
        demand: { wordstat: 6100, trend: 11, hhVacancies: 120, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера it аутсорс',
        pains: ['авансы и акты по этапам проектов', 'заказчики из других стран и курсовые разницы', 'ИП-подрядчики вместо штата'],
        services: [
          ['Аудит договоров и учёта студии', '10 000–20 000 ₽'],
          ['Ведение ООО', 'от 25 000 ₽/мес'],
          ['Настройка управленческой отчётности', 'от 40 000 ₽']
        ],
        lead: 'Разбор: 5 ошибок в договорах разработки, которые бьют по налогам',
        channels: ['Telegram-сообщества студий и агентств', 'Биржи и каталоги веб-разработки', 'Рекомендации смежных студий'],
        hook: 'Бухгалтерия IT-студии: авансы, акты, зарубежные заказчики — понятная схема',
        offer: 'Поставлю учёт IT-студии: авансы, акты по этапам, зарубежные заказчики — и ежемесячную управленческую отчётность, которую вы поймёте за 15 минут.',
        note: 'Управленка для студий — то, что удерживает клиента годами: бухучёт плюс цифры для решений.'
      },
      {
        id: 'ved',
        name: 'ВЭД и импортёры',
        sphere: 'ВЭД',
        types: ['ooo'],
        clientDesc: 'Импортёры товаров, 3–20 сотрудников',
        s: { demand: 3, competition: 4, check: 5, recurring: 4, entry: 2, remote: 4 },
        q1: 'бухгалтер для вэд',
        demand: { wordstat: 2100, trend: 9, hhVacancies: 60, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера вэд',
        pains: ['таможенные платежи и их учёт', 'курсовые разницы и инкотермс', 'возмещение НДС и партионный учёт'],
        services: [
          ['Аудит ВЭД-учёта', '20 000–40 000 ₽'],
          ['Ведение с возмещением НДС', 'от 50 000 ₽/мес'],
          ['Постановка партионного учёта себестоимости', 'от 60 000 ₽']
        ],
        lead: 'Чек-лист документов импортёра для возмещения НДС',
        channels: ['Сообщества импортёров и селлеров', 'Таможенные брокеры', 'Логистические компании'],
        hook: 'Бухгалтерия импортёра: платежи, инкотермс и НДС к возмещению — без потерь',
        offer: 'Разберу ваш ВЭД-учёт: таможенные платежи, инкотермс, НДС к возмещению — покажу, где теряются деньги, и поставлю учёт, который проходит проверки.',
        note: 'Мало конкурентов из-за сложности — ваш опыт с договорами и первичкой прямой путь к чекам 50 000+.'
      },
      {
        id: 'realty',
        name: 'Недвижимость: аренда и управление',
        sphere: 'Недвижимость',
        types: ['ip', 'ooo'],
        clientDesc: 'Агентства, УК и собственники коммерческой недвижимости',
        s: { demand: 3, competition: 2, check: 5, recurring: 4, entry: 4, remote: 5 },
        q1: 'бухгалтер в недвижимости',
        demand: { wordstat: 3900, trend: 4, hhVacancies: 110, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера агентство недвижимости',
        pains: ['НДС при аренде и залоги арендаторов', 'коммунальные платежи и компенсации', 'учёт по объектам и собственникам'],
        services: [
          ['Аудит учёта аренды', '10 000–25 000 ₽'],
          ['Ведение ООО на УСН/ОСНО', 'от 25 000 ₽/мес'],
          ['Настройка учёта по объектам', 'от 40 000 ₽']
        ],
        lead: 'Как управляющему недвижимостью не переплатить НДС',
        channels: ['Сообщества риелторов и управляющих', 'Тендерные площадки', 'Знакомые агентства недвижимости'],
        hook: 'Учёт аренды и управления недвижимостью: залоги, коммуналка, НДС — разложено по объектам',
        offer: 'Разложу учёт аренды по объектам: залоги, коммуналка, НДС — собственник видит доходность каждого метра.',
        note: 'Ниша, знакомая вам по ООО в недвижимости, — используйте собственные кейсы как доказательство.'
      },
      {
        id: 'build',
        name: 'Строительные бригады и ремонт',
        sphere: 'Стройка и ремонт',
        types: ['ip', 'ooo'],
        clientDesc: 'Бригады и мелкие подрядчики, 2–15 человек',
        s: { demand: 4, competition: 3, check: 4, recurring: 2, entry: 3, remote: 3 },
        q1: 'бухгалтер в строительстве',
        demand: { wordstat: 7200, trend: 8, hhVacancies: 170, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера строительный подрядчик',
        pains: ['договоры подряда и закрывающие акты', 'расчёты с рабочими и НДФЛ', 'закупки без документов'],
        services: [
          ['Аудит учёта подрядчика', '7 000–15 000 ₽'],
          ['Ведение ИП/ООО', 'от 18 000 ₽/мес'],
          ['Настройка документооборота с бригадами', 'от 30 000 ₽']
        ],
        lead: 'Памятка: какие документы бригадир должен отдавать ежедневно',
        channels: ['Чаты прорабов и подрядчиков', 'Поставщики стройматериалов', 'Каталоги услуг (Профи, Авито)'],
        hook: 'Бухгалтерия стройки и ремонта: договоры, акты, рабочие — порядок вместо свалки чеков',
        offer: 'Переведу стройку на понятный документооборот: договоры, акты, расчёты с рабочими — стройка работает, документы перестают тонуть.',
        note: 'Повторяемость средняя (сезонные проекты), зато вход простой — хорошая вторая ниша к основной.'
      },
      {
        id: 'nko',
        name: 'НКО, ТСЖ и управляющие компании',
        sphere: 'ЖКХ и НКО',
        types: ['ooo'],
        clientDesc: 'ТСЖ, УК, фонды и ассоциации',
        s: { demand: 3, competition: 4, check: 2, recurring: 5, entry: 3, remote: 4 },
        q1: 'бухгалтер нко',
        demand: { wordstat: 1800, trend: -3, hhVacancies: 40, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'нужен бухгалтер тсж',
        pains: ['целевое финансирование и отчёты перед донорами', 'членские взносы и льготы', 'специфика плана счетов НКО'],
        services: [
          ['Ведение НКО', 'от 15 000 ₽/мес'],
          ['Сдача отчётности ТСЖ', 'от 10 000 ₽/мес'],
          ['Аудит целевого использования средств', 'от 20 000 ₽']
        ],
        lead: 'Шпаргалка: годовая отчётность ТСЖ — что и когда сдавать',
        channels: ['Реестры ТСЖ вашего города', 'Ассоциации НКО и грант-операторы', 'Местные администрации'],
        hook: 'Учёт для ТСЖ и НКО: целевые средства, взносы, отчётность — спокойный доход каждый месяц',
        offer: 'Возьму отчётность ТСЖ или НКО: целевые средства, взносы, годовые отчёты — спокойный учёт за разумные деньги.',
        note: 'Чеки ниже среднего, зато пожизненная абонентка и почти нулевая конкуренция.'
      },
      {
        id: 'factory',
        name: 'Производство и крафт',
        sphere: 'Производство',
        types: ['ip', 'ooo'],
        clientDesc: 'Мини-производства, 2–20 сотрудников',
        s: { demand: 3, competition: 4, check: 3, recurring: 4, entry: 3, remote: 3 },
        q1: 'бухгалтер на производство',
        demand: { wordstat: 2900, trend: 5, hhVacancies: 75, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера производство себестоимость',
        pains: ['расчёт себестоимости партий', 'сырьё и незавершённое производство', 'маркировка «Честный знак»'],
        services: [
          ['Аудит учёта производства', '8 000–18 000 ₽'],
          ['Ведение ИП/ООО', 'от 20 000 ₽/мес'],
          ['Постановка расчёта себестоимости', 'от 35 000 ₽']
        ],
        lead: 'Как посчитать себестоимость и не продавать в минус',
        channels: ['Ассоциации и чаты производителей', 'Отраслевые выставки', 'Сообщества крафта'],
        hook: 'Бухгалтерия производства: себестоимость, сырьё, маркировка — цифры, которым веришь',
        offer: 'Настрою расчёт себестоимости производства: сырьё, незавершёнка, маркировка — вы увидите реальную прибыль каждой партии.',
        note: 'Себестоимость владельцы сами никогда не осилят — монетизируйте именно это.'
      },
      {
        id: 'fitness',
        name: 'Фитнес и студии',
        sphere: 'Фитнес',
        types: ['ip', 'ooo'],
        clientDesc: 'Студии йоги, танцев и фитнеса, 1–10 сотрудников',
        s: { demand: 3, competition: 3, check: 3, recurring: 4, entry: 4, remote: 4 },
        q1: 'бухгалтер для фитнеса',
        demand: { wordstat: 2600, trend: 7, hhVacancies: 55, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера студию',
        pains: ['абонементы, авансы и отложенная выручка', 'тренеры-самозанятые', 'комиссии администраторов и онлайн-занятия'],
        services: [
          ['Аудит учёта студии', '5 000–12 000 ₽'],
          ['Ведение ИП/ООО', 'от 15 000 ₽/мес'],
          ['Настройка учёта абонементов', 'от 25 000 ₽']
        ],
        lead: 'Чек-лист: как студии принимать оплату за абонементы легально',
        channels: ['Чаты владельцев студий и фитнеса', 'CRM-партнёрки для фитнеса', 'Локальные бизнес-сообщества'],
        hook: 'Учёт для студий: абонементы, авансы, тренеры-самозанятые — без сюрпризов',
        offer: 'Наведу порядок в абонементах студии: авансы, отложенная выручка, тренеры-самозанятые — касса и налоги перестают пугать.',
        note: 'Лёгкий вход и тёплые сообщества — хорошая первая ниша для обкатки воронки.'
      },
      {
        id: 'logistics',
        name: 'Грузоперевозки и логистика',
        sphere: 'Логистика',
        types: ['ip', 'ooo'],
        clientDesc: 'Перевозчики и экспедиторы, 1–20 машин',
        s: { demand: 3, competition: 3, check: 3, recurring: 4, entry: 3, remote: 4 },
        q1: 'бухгалтер для грузоперевозок',
        demand: { wordstat: 3100, trend: 3, hhVacancies: 85, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера перевозки',
        pains: ['путевые листы и учёт ГСМ', 'акты и отсрочки платежей', 'расчёты с водителями'],
        services: [
          ['Аудит учёта перевозчика', '7 000–15 000 ₽'],
          ['Ведение ИП/ООО', 'от 18 000 ₽/мес'],
          ['Настройка документооборота перевозок', 'от 30 000 ₽']
        ],
        lead: 'Памятка: документы перевозчика, без которых вы теряете на налогах',
        channels: ['Чаты логистов и перевозчиков', 'Биржи грузоперевозок (АТИ)', 'Заправки и лизинговые компании'],
        hook: 'Бухгалтерия перевозок: путевые листы, ГСМ, отсрочки — дисциплина в документах',
        offer: 'Приведу в порядок документы перевозок: путевые листы, ГСМ, акты с отсрочками — налоговая видит всё, вы платите меньше.',
        note: 'Плотная ниша с понятной абоненткой; вход — через разбор документов.'
      },
      {
        id: 'beauty',
        name: 'Бьюти: салоны и мастера',
        sphere: 'Красота',
        types: ['ip'],
        clientDesc: 'Салоны и мастера, 1–15 человек',
        s: { demand: 4, competition: 2, check: 2, recurring: 4, entry: 4, remote: 4 },
        q1: 'бухгалтер для салона красоты',
        demand: { wordstat: 5400, trend: 12, hhVacancies: 95, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера салон красоты',
        pains: ['мастера-самозанятые и комиссии', 'чеки за услуги и материалы', 'аренда кресел и мест'],
        services: [
          ['Аудит учёта салона', '4 000–10 000 ₽'],
          ['Ведение ИП', 'от 12 000 ₽/мес'],
          ['Настройка чеков и расчётов с мастерами', 'от 20 000 ₽']
        ],
        lead: 'Чек-лист: салон и мастера-самозанятые — как не нарушить закон',
        channels: ['Чаты мастеров и владельцев салонов', 'Поставщики косметики', 'CRM-партнёрки (YCLIENTS)'],
        hook: 'Бухгалтерия салона: мастера, чеки, аренда кресел — по-честному и без штрафов',
        offer: 'Настрою учёт салона: мастера-самозанятые, чеки, аренда кресел — без штрафов и конфликтов с мастерами.',
        note: 'Чеки небольшие, но клиентов очень много — идеальна для массовой автоворонки.'
      },
      {
        id: 'auto',
        name: 'Автосервисы и детейлинг',
        sphere: 'Автобизнес',
        types: ['ip', 'ooo'],
        clientDesc: 'Сервисы и детейлинг-центры, 2–15 сотрудников',
        s: { demand: 3, competition: 3, check: 3, recurring: 4, entry: 3, remote: 3 },
        q1: 'бухгалтер автосервис',
        demand: { wordstat: 2800, trend: 2, hhVacancies: 70, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера автосервис',
        pains: ['заказ-наряды и приёмка авто', 'учёт запчастей и возвраты', 'сдельная зарплата мастеров'],
        services: [
          ['Аудит учёта сервиса', '5 000–12 000 ₽'],
          ['Ведение ИП/ООО', 'от 15 000 ₽/мес'],
          ['Постановка учёта запчастей', 'от 25 000 ₽']
        ],
        lead: 'Чек-лист: заказ-наряд, который защитит в споре с клиентом и в налоговой',
        channels: ['Сообщества автосервисов', 'Поставщики автозапчастей', 'CRM-партнёрки автосервисов'],
        hook: 'Учёт для автосервиса: заказ-наряды, запчасти, сдельная зарплата — чисто и прозрачно',
        offer: 'Поставлю учёт автосервиса: заказ-наряды, запчасти, сдельная зарплата — прозрачность для владельца и для налоговой.',
        note: 'Скучная, но стабильная ниша — абонементы держатся годами.'
      },
      {
        id: 'coffee',
        name: 'Кофейни и общепит',
        sphere: 'Общепит',
        types: ['ip', 'ooo'],
        clientDesc: 'Кофейни и точки общепита, 2–20 сотрудников',
        s: { demand: 3, competition: 2, check: 3, recurring: 5, entry: 2, remote: 2 },
        q1: 'бухгалтер для общепита',
        demand: { wordstat: 3300, trend: 6, hhVacancies: 65, updated: '2026-09-12', updatedAt: '2026-09-12T12:00:00+03:00', demo: true },
        q2: 'ищу бухгалтера кофейня',
        pains: ['инвентаризация и списания', 'комиссии курьер-агрегаторов', 'касса, меню и скидки'],
        services: [
          ['Аудит учёта кофейни', '8 000–15 000 ₽'],
          ['Ведение ИП/ООО', 'от 20 000 ₽/мес'],
          ['Постановка инвентаризации', 'от 30 000 ₽']
        ],
        lead: 'Как кофейне свести инвентаризацию за 30 минут',
        channels: ['Чаты кофейней и франчайзи', 'Поставщики кофе и оборудования', 'Сообщества общепита'],
        hook: 'Бухгалтерия кофейни: касса, инвентаризация, агрегаторы — цифры каждый день',
        offer: 'Возьму кофейню на учёт: касса, инвентаризация, комиссии агрегаторов — цифры каждый день, а не раз в квартал.',
        note: 'Вход сложный (касса, инвентаризация), зато абонемент пожизненный. Ниша не чисто удалённая — иногда нужен выезд.'
      }
    ];

    var PARTNERS = [
      {
        name: 'Контур.Эльба',
        cat: 'Онлайн-бухгалтерия',
        verified: true,
        rate: 'до 50% от оплаты приведённого клиента',
        model: 'Реферальная программа: клиент оплачивает сервис по вашей ссылке, Контур делится оплатой. Вариант «приведи друга» — 25% от первой оплаты вам и 3 месяца сервиса другу.',
        fit: 'Клиенты-ИП на УСН и патенте — ваша прямая аудитория: рекомендация известного сервиса не выглядит рекламой.',
        url: 'https://kontur.ru/partnership/online',
        urlLabel: 'kontur.ru/partnership',
        src: 'Источники: kontur.ru, audit-it.ru'
      },
      {
        name: 'Моё дело',
        cat: 'Онлайн-бухгалтерия',
        verified: true,
        rate: 'до 10 000 ₽ за приглашённого клиента',
        model: 'Реферальная программа: друг получает скидку 25%, вы — вознаграждение в зависимости от его тарифа. Отдельные партнёрские программы для юрлиц и ИП и для самозанятых.',
        fit: 'Партнёром может стать даже самозанятый — редкий и удобный случай для старта.',
        url: 'https://www.moedelo.org/partnerskiye-programmy',
        urlLabel: 'moedelo.org',
        src: 'Источники: moedelo.org, pampadu.ru'
      },
      {
        name: 'Т-Банк — Т-Партнёры',
        cat: 'Банки и РКО',
        verified: true,
        rate: 'до 70 500 ₽ за одного клиента по бизнес-оферте',
        model: 'Выплаты за целевые действия по оферте: открытие расчётного счёта, оформление продуктов. Работа онлайн в личном кабинете, договор с банком.',
        fit: 'Рекомендация РКО — естественная услуга бухгалтера при регистрации ИП и ООО.',
        url: 'https://www.tbank.ru/business/partnership/',
        urlLabel: 'tbank.ru/business/partnership',
        src: 'Источники: tbank.ru, t-j.ru'
      },
      {
        name: 'Точка',
        cat: 'Банки и РКО',
        verified: true,
        rate: 'до 20 000 ₽ за клиента + до 15% от дохода банка',
        model: 'Партнёрская программа для рекомендателей и агентов: разовое вознаграждение за привлечённого клиента плюс процент от дохода банка с него.',
        fit: 'Два потока в одной программе: фикс за подключение и процент, похожий на абонемент.',
        url: 'https://tochka.com/partners/',
        urlLabel: 'tochka.com/partners',
        src: 'Источник: tochka.com'
      },
      {
        name: 'Модульбанк',
        cat: 'Банки и РКО',
        verified: true,
        rate: 'вознаграждение за клиента + постоянный процент от дохода',
        model: 'Партнёрская программа с постоянными выплатами от дохода банка с привлечённого клиента; суммы зависят от продукта — смотрите оферту.',
        fit: 'Модель «процент навсегда»: один приведённый клиент приносит доход месяцами.',
        url: 'https://www.modulbank.ru/',
        urlLabel: 'modulbank.ru',
        src: 'Источники: klerk.ru, banki.ru'
      },
      {
        name: '1С:Фреш — партнёрский канал',
        cat: '1С и облако',
        verified: true,
        rate: 'до 65% от стоимости подписки пользователя',
        model: 'Вы подключаете клиентов к облачным программам 1С через партнёрский канал и получаете долю от стоимости подписки, включая продления.',
        fit: 'Вы и так живёте в 1С — рекомендация облачной подписки выглядит как забота, а не реклама.',
        url: 'https://partners.1cfresh.com/',
        urlLabel: 'partners.1cfresh.com',
        src: 'Источник: partners.1cfresh.com'
      },
      {
        name: 'Кнопка',
        cat: 'Бухгалтерский аутсорс',
        verified: false,
        rate: 'условия уточнить по оферте',
        model: 'Вознаграждение за клиента, переданного на аутсорс-обслуживание. Публичных ставок нет — перед подключением проверьте актуальные условия.',
        fit: 'Если клиенту нужен не один бухгалтер, а команда, — передайте его в аутсорс и получите вознаграждение вместо отказа.',
        url: 'https://knopka.com/',
        urlLabel: 'knopka.com',
        src: 'Источник: knopka.com'
      },
      {
        name: 'Skillbox / Skypro',
        cat: 'Обучение',
        verified: false,
        rate: 'процент с продажи курса (зависит от курса)',
        model: 'CPA-партнёрки онлайн-школ через партнёрские сети: ставки и периоды подтверждения лидов меняются — сверяйте в кабинете сети.',
        fit: 'Подходит, если ведёте блог для тех, кто хочет стать свободным бухгалтером.',
        url: 'https://skillbox.ru/',
        urlLabel: 'skillbox.ru',
        src: 'Источники: skillbox.ru, admitad.ru'
      }
    ];

    var PARTNER_CATS = ['Все', 'Банки и РКО', 'Онлайн-бухгалтерия', '1С и облако', 'Бухгалтерский аутсорс', 'Обучение'];

    var LISTINGS = [
      { id: 'l1', platform: 'Авито', title: 'Ищу бухгалтера для селлера на маркетплейсах', niche: 'marketplaces', city: 'Москва', date: '2026-09-12', budget: 'от 15 000 ₽/мес', text: 'Селлер на УСН, обороты растут: нужна сверка комиссий и ведение ЕНС. Готов к долгому сотрудничеству.', search: { platform: 'avito', q: 'бухгалтер маркетплейс' }, demo: true },
      { id: 'l2', platform: 'hh.ru', title: 'Бухгалтер в частную клинику (возможен аутсорс)', niche: 'clinics', city: 'Санкт-Петербург', date: '2026-09-11', budget: 'до 60 000 ₽/мес', text: 'Нужно ведение учёта клиники: медикаменты, расчёт зарплат. Рассматриваем передачу на аутсорс.', search: { platform: 'hh', q: 'бухгалтер для стоматологии' }, demo: true },
      { id: 'l3', platform: 'Авито', title: 'Нужен бухгалтер строительной бригаде — разовый аудит', niche: 'build', city: 'Екатеринбург', date: '2026-09-10', budget: 'разово, по договорённости', text: 'Бригада на УСН запуталась в актах и расчётах с рабочими. Нужен аудит и настройка документооборота.', search: { platform: 'avito', q: 'бухгалтер в строительстве' }, demo: true },
      { id: 'l4', platform: 'YouDo', title: 'Настроить учёт салона красоты: мастера-самозанятые и чеки', niche: 'beauty', city: 'Казань', date: '2026-09-09', budget: 'до 20 000 ₽', text: 'Салон с 6 мастерами: разложить комиссии, чеки и договоры с самозанятыми.', search: { platform: 'youdo', q: 'бухгалтер для салона красоты' }, demo: true },
      { id: 'l5', platform: 'hh.ru', title: 'Ведение учёта аренды недвижимости (аутсорс)', niche: 'realty', city: 'Москва', date: '2026-09-08', budget: 'от 25 000 ₽/мес', text: 'Собственник коммерческой недвижимости ищет бухгалтера на постоянное ведение: залоги, коммуналка, НДС по объектам.', search: { platform: 'hh', q: 'бухгалтер в недвижимости' }, demo: true },
      { id: 'l6', platform: 'Telegram', title: 'ТСЖ ищет бухгалтера на отчётность', niche: 'nko', city: 'Нижний Новгород', date: '2026-09-07', budget: 'от 10 000 ₽/мес', text: 'ТСЖ, 4 дома: годовая отчётность и ведение взносов. Обсуждают в профильных чатах.', search: { platform: 'tgstat', q: 'бухгалтер нко' }, demo: true }
    ];

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function totalW() {
      var t = 0;
      CRITERIA.forEach(function (c) { t += W[c.k]; });
      return t;
    }
    function rating(n) {
      var t = totalW() || 1;
      var raw = 0;
      CRITERIA.forEach(function (c) { raw += n.s[c.k] * W[c.k]; });
      return raw / (5 * t) * 10;
    }
    function tier(r) { return r >= 7.5 ? 'ok' : (r >= 6 ? 'mid' : 'low'); }

    function saveWeights() { store.set(WEIGHTS_KEY, JSON.stringify(W)); }

    /* ── Нишедатель ─────────────────────────────────────────── */
    var state = { q: '', client: 'all', sphere: 'all', sort: 'rating' };

    function nicheCard(n, r, rank) {
      var t = tier(r);
      var badge = rank === 1
        ? '<span class="pill">Лучший рейтинг</span>'
        : (rank === 2 || rank === 3 ? '<span class="tag">топ-3</span>' : '');
      var bars = CRITERIA.map(function (c) {
        return '<span class="bar" title="' + esc(c.label) + ': ' + n.s[c.k] + ' из 5"><i style="width:' + (n.s[c.k] / 5 * 100) + '%"></i></span>';
      }).join('');
      var pains = n.pains.map(function (p) { return '<span class="tag">' + esc(p) + '</span>'; }).join('');
      var svc = n.services.map(function (s) {
        return '<li><span>' + esc(s[0]) + '</span><span class="num">' + esc(s[1]) + '</span></li>';
      }).join('');
      var types = n.types.map(function (x) { return x === 'ip' ? 'ИП' : 'ООО'; }).join(' · ');
      return '<article class="card niche-card' + (rank === 1 ? ' top1' : '') + '">' +
        '<div class="row-between"><span class="row" style="gap:10px; flex-wrap:wrap;"><span class="rate-pill num"><span class="rate-dot ' + t + '"></span>' + r.toFixed(1).replace('.', ',') + '<span class="pill-tier">' + TIER_LABEL[t] + '</span></span>' + badge + '</span><span class="meta">№ ' + rank + '</span></div>' +
        '<h3>' + esc(n.name) + '</h3>' +
        '<p class="niche-client">' + esc(n.clientDesc) + '</p>' +
        '<div class="pain-tags"><span class="tag">' + esc(n.sphere) + '</span><span class="tag">' + types + '</span></div>' +
        '<div class="bars">' + bars + '</div>' +
        demandChips(n) +
        '<p class="niche-label">Что болит у клиента</p>' +
        '<div class="pain-tags">' + pains + '</div>' +
        '<p class="niche-label">Что продавать</p>' +
        '<ul class="svc">' + svc + '</ul>' +
        '<p class="niche-label">Лид-магнит</p>' +
        '<p class="niche-lead">' + esc(n.lead) + '</p>' +
        '<p class="niche-note"><strong>Совет:</strong> ' + esc(n.note) + '</p>' +
        '<div class="niche-cta">' +
        '<button type="button" class="btn btn-ink btn-sm" data-open="' + esc(n.id) + '">Открыть нишу</button>' +
        '<a class="btn btn-secondary btn-sm btn-arrow" href="offer.html" data-niche="' + esc(n.id) + '">Собрать оффер</a>' +
        '</div>' +
        '</article>';
    }

    function renderNiches() {
      if (!$('#niche-grid')) return;
      var q = state.q.trim().toLowerCase();
      var list = NICHES.filter(function (n) {
        if (state.client !== 'all' && n.types.indexOf(state.client) === -1) return false;
        if (state.sphere !== 'all' && n.sphere !== state.sphere) return false;
        if (q) {
          var hay = [n.name, n.clientDesc, n.lead, n.note]
            .concat(n.pains)
            .concat(n.services.map(function (s) { return s[0]; }))
            .join(' ').toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      }).map(function (n) { return { n: n, r: rating(n) }; });

      if (state.sort === 'check') {
        list.sort(function (a, b) { return b.n.s.check - a.n.s.check || b.r - a.r; });
      } else if (state.sort === 'demand') {
        list.sort(function (a, b) { return b.n.s.demand - a.n.s.demand || b.r - a.r; });
      } else {
        list.sort(function (a, b) { return b.r - a.r; });
      }

      var grid = $('#niche-grid');
      var empty = $('#niche-empty');
      $('#niche-count').textContent = 'Показано: ' + list.length + ' из ' + NICHES.length + ' ниш';
      if (!list.length) {
        grid.innerHTML = '';
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      grid.innerHTML = list.map(function (o, i) { return nicheCard(o.n, o.r, i + 1); }).join('');
    }

    function syncWeights() {
      var t = totalW() || 1;
      $all('.w-out').forEach(function (o) {
        o.textContent = Math.round(W[o.getAttribute('data-k')] / t * 100) + '%';
      });
    }

    function clearPresetSelection() {
      $all('.preset').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    }

    function resetWeights() {
      $all('.weight-row input[type="range"]').forEach(function (inp) {
        W[inp.getAttribute('data-k')] = DEFAULT_W[inp.getAttribute('data-k')];
        inp.value = DEFAULT_W[inp.getAttribute('data-k')];
      });
      clearPresetSelection();
      syncWeights();
      renderNiches();
      saveWeights();
    }

    function applyPreset(key) {
      var p = PRESETS[key];
      if (!p) return;
      $all('.weight-row input[type="range"]').forEach(function (inp) {
        var k = inp.getAttribute('data-k');
        W[k] = p[k];
        inp.value = p[k];
      });
      $all('.preset').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-preset') === key));
      });
      syncWeights();
      renderNiches();
      saveWeights();
    }

    /* ── Партнёрки ──────────────────────────────────────────── */
    var partnerCat = 'Все';

    function partnerCard(p) {
      var badge = p.verified
        ? '<span class="p-badge verified"><span class="p-dot"></span>проверено по открытым источникам</span>'
        : '<span class="p-badge check"><span class="p-dot"></span>условия уточнить</span>';
      return '<article class="card partner-card">' +
        '<div class="row-between">' + badge + '<span class="tag">' + esc(p.cat) + '</span></div>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p class="p-rate">' + esc(p.rate) + '</p>' +
        '<p class="p-model">' + esc(p.model) + '</p>' +
        '<p class="p-fit">' + esc(p.fit) + '</p>' +
        '<p class="p-src">' + esc(p.src) + '</p>' +
        '<a class="p-link" href="' + p.url + '" target="_blank" rel="noopener">' + esc(p.urlLabel) + ' →</a>' +
        '</article>';
    }

    function renderPartners() {
      if (!$('#partner-grid')) return;
      var list = PARTNERS.filter(function (p) {
        return partnerCat === 'Все' || p.cat === partnerCat;
      });
      $('#partner-count').textContent = 'Показано: ' + list.length + ' из ' + PARTNERS.length + ' программ';
      $('#partner-grid').innerHTML = list.map(partnerCard).join('');
    }

    function renderChips() {
      var box = $('#partner-chips');
      if (!box) return;
      box.innerHTML = PARTNER_CATS.map(function (c) {
        return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === partnerCat) + '">' + esc(c) + '</button>';
      }).join('');
      $all('button', box).forEach(function (b) {
        b.addEventListener('click', function () {
          partnerCat = b.getAttribute('data-cat');
          renderChips();
          renderPartners();
        });
      });
    }

    /* ── Лента заявок ───────────────────────────────────────── */
    var feedState = { q: '', platform: 'Все', niche: 'all' };

    function searchUrl(s) {
      if (!s) return '#';
      var q = ENC(s.q || 'бухгалтер');
      if (s.platform === 'avito') return 'https://www.avito.ru/all?q=' + q;
      if (s.platform === 'hh') return 'https://hh.ru/search/vacancy?text=' + q;
      if (s.platform === 'youdo') return 'https://youdo.com/?q=' + q;
      if (s.platform === 'tgstat') return 'https://tgstat.ru/search?q=' + q;
      if (s.platform === 'vk') return 'https://vk.com/search?c%5Bq%5D=' + q;
      return 'https://ya.ru/search/?text=' + q;
    }

    function fmtDate(iso) {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) { return iso; }
    }

    function feedItem(l) {
      var n = l.niche ? findNiche(l.niche) : null;
      var tags = '<span class="tag">' + esc(l.platform) + '</span>' +
        (n ? '<span class="tag">' + esc(n.sphere) + '</span>' : '') +
        (l.demo ? '<span class="tag">демо — откроется живой поиск</span>' : '');
      var meta = [l.city || '', fmtDate(l.date), l.budget || ''].filter(Boolean).join(' · ');
      return '<a class="feed-item" href="' + (l.url || searchUrl(l.search)) + '" target="_blank" rel="noopener" title="Открыть объявление на площадке">' +
        '<div class="feed-main">' +
        '<div class="pain-tags">' + tags + '</div>' +
        '<h3 class="feed-title">' + esc(l.title) + '</h3>' +
        (meta ? '<p class="meta" style="margin: 4px 0 6px;">' + esc(meta) + '</p>' : '') +
        '<p class="feed-text">' + esc(l.text || '') + '</p>' +
        '</div>' +
        '<span class="feed-open">Открыть объявление →</span>' +
        '</a>';
    }

    function renderFeed() {
      if (!$('#feed-grid')) return;
      var q = feedState.q.trim().toLowerCase();
      var list = LISTINGS.filter(function (l) {
        if (feedState.platform !== 'Все' && l.platform !== feedState.platform) return false;
        if (feedState.niche !== 'all' && l.niche !== feedState.niche) return false;
        if (q) {
          var hay = [l.title, l.text, l.city, l.platform, l.budget].join(' ').toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      }).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });

      $('#feed-count').textContent = 'Показано: ' + list.length + ' из ' + LISTINGS.length + ' заявок · свежие сверху';
      var grid = $('#feed-grid');
      var empty = $('#feed-empty');
      if (!list.length) { grid.innerHTML = ''; empty.hidden = false; return; }
      empty.hidden = true;
      grid.innerHTML = list.map(feedItem).join('');
    }

    function renderFeedChips() {
      var box = $('#feed-chips');
      if (!box) return;
      var plats = ['Все'];
      LISTINGS.forEach(function (l) { if (plats.indexOf(l.platform) === -1) plats.push(l.platform); });
      box.innerHTML = plats.map(function (p) {
        return '<button type="button" class="preset" data-plat="' + esc(p) + '" aria-pressed="' + (p === feedState.platform) + '">' + esc(p) + '</button>';
      }).join('');
      $all('button', box).forEach(function (b) {
        b.addEventListener('click', function () {
          feedState.platform = b.getAttribute('data-plat');
          renderFeedChips();
          renderFeed();
        });
      });
    }

    function renderFeedGroups() {
      var box = $('#feed-groups');
      if (!box) return;
      var n = feedState.niche === 'all' ? null : findNiche(feedState.niche);
      box.innerHTML = feedSourceGroups(n).map(function (g) {
        return '<div class="src-group"><h4>' + esc(g.group) + '</h4>' +
          (g.note ? '<p class="niche-note" style="margin: 0 0 6px;">' + esc(g.note) + '</p>' : '') +
          g.items.map(function (it) {
            return '<a class="src-link" href="' + it.url + '" target="_blank" rel="noopener"><span>' + esc(it.label) + '</span><span class="arrow">↗</span></a>';
          }).join('') + '</div>';
      }).join('');
    }

    /* ── Источники и поиск клиентов в нише ──────────────────── */
    function ENC(s) { return encodeURIComponent(s); }

    /* ── Спрос: автоматические цифры из базы ────────────────── */
    function fmtInt(n) {
      try { return Number(n).toLocaleString('ru-RU'); } catch (e) { return String(n); }
    }
    function trendChip(t) {
      var v = Number(t) || 0;
      var arrow = v > 0 ? '↑' : (v < 0 ? '↓' : '→');
      return arrow + ' ' + (v > 0 ? '+' : '') + v + '%';
    }
    function feedCountFor(id) {
      var c = 0;
      LISTINGS.forEach(function (l) { if (l.niche === id) c++; });
      return c;
    }
    function maxWordstat() {
      var m = 0;
      NICHES.forEach(function (n) { if (n.demand && n.demand.wordstat > m) m = n.demand.wordstat; });
      return m || 1;
    }
    function demandChips(n) {
      var d = n.demand;
      if (!d) return '';
      return '<div class="demand-line">' +
        '<span class="demand-chip">спрос: ' + fmtInt(d.wordstat) + '/мес</span>' +
        '<span class="demand-chip">' + trendChip(d.trend) + ' за 3 мес</span>' +
        '</div>';
    }
    function fmtAgo(iso) {
      if (!iso) return 'нет отметки времени';
      var t = new Date(iso).getTime();
      if (isNaN(t)) return String(iso);
      var s = Math.max(0, Math.round((Date.now() - t) / 1000));
      if (s < 90) return 'только что';
      var m = Math.round(s / 60);
      if (m < 60) return m + ' мин назад';
      var h = Math.round(m / 60);
      if (h < 24) return h + ' ч назад';
      return Math.round(h / 24) + ' дн назад';
    }

    function plural(n, one, few, many) {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
      return many;
    }
    function demandPanel(n) {
      var d = n.demand;
      if (!d) {
        return '<p class="niche-label" style="margin-top: 24px;">Спрос онлайн</p>' +
          '<p class="niche-note" style="margin: 0;">Для этой ниши цифры спроса ещё не заполнены в базе (поле demand). Сервис обновления базы заполнит их — и они появятся здесь сами.</p>';
      }
      var lvl = Math.round(Math.min(1, d.wordstat / maxWordstat()) * 100);
      var upd = d.updatedAt || dataUpdatedAt();
      var badge = d.demo === false ? '<span class="tag">реальные данные</span>' : '<span class="tag">демо</span>';
      return '<p class="niche-label" style="margin-top: 24px;">Спрос — из базы, обновляется автоматически</p>' +
        '<div class="demand-grid">' +
        '<div class="demand-cell"><span class="demand-num num">' + fmtInt(d.wordstat) + '</span><span class="demand-cap">показов в поиске за месяц (Вордстат)</span></div>' +
        '<div class="demand-cell"><span class="demand-num num">' + trendChip(d.trend) + '</span><span class="demand-cap">динамика за 3 месяца</span></div>' +
        '<div class="demand-cell"><span class="demand-num num">' + fmtInt(d.hhVacancies) + '</span><span class="demand-cap">' + (d.vacanciesSource === 'trudvsem.ru' ? plural(d.hhVacancies, 'вакансия', 'вакансии', 'вакансий') + ' на «Работе России»' : 'активных вакансий на hh.ru') + '</span></div>' +
        '<div class="demand-cell"><span class="demand-num num">' + feedCountFor(n.id) + '</span><span class="demand-cap">заявок в ленте прямо сейчас</span></div>' +
        '</div>' +
        '<div class="demand-bar" title="уровень спроса относительно самой популярной ниши базы"><i style="width: ' + lvl + '%"></i></div>' +
        '<p class="meta" style="margin: 0 0 6px;">Уровень: ' + lvl + '% от максимума по базе · обновлено ' + esc(fmtAgo(upd)) + ' ' + badge + '</p>' +
        '<p class="niche-note" style="margin: 0 0 8px;">Значения берутся из базы при открытии страницы и далее каждые 10 минут. Реальные цифры пишет в базу сервис обновления (Вордстат/hh) — скрипт прилагается: tools/update-demand.mjs.</p>' +
        '<a class="p-link" style="margin: 0;" href="https://wordstat.yandex.ru/#!/?words=' + ENC(n.q1) + '" target="_blank" rel="noopener">Открыть источник: Вордстат →</a>';
    }

    function dataUpdatedAt() {
      try { return (window.NB_DATA && window.NB_DATA.demandUpdatedAt) || ''; } catch (e) { return ''; }
    }

    function feedSourceGroups(n) {
      var q1 = n ? n.q1 : 'бухгалтер';
      var q2 = n ? n.q2 : 'ищу бухгалтера';
      return [
        {
          group: 'Доски услуг и объявлений',
          note: 'где заказчики публикуют задачи и ищут исполнителя',
          items: [
            { label: 'Авито Услуги — «' + q1 + '»', url: 'https://www.avito.ru/all?q=' + ENC(q1) },
            { label: 'YouDo — «' + q1 + '»', url: 'https://youdo.com/?q=' + ENC(q1) }
          ]
        },
        {
          group: 'Сайты с работой: кто ищет бухгалтера в найм — тёплый клиент на аутсорс',
          note: 'вакансия без бухгалтера в штате или на замену = готовая боль, которую вы закрываете дешевле найма',
          items: [
            { label: 'hh.ru — вакансии «' + q1 + '»', url: 'https://hh.ru/search/vacancy?text=' + ENC(q1) },
            { label: 'hh.ru — «' + q2 + '»', url: 'https://hh.ru/search/vacancy?text=' + ENC(q2) }
          ]
        },
        {
          group: 'Сообщества, чаты и форумы',
          note: 'где владельцы бизнеса обсуждают учёт и спрашивают совета',
          items: [
            { label: 'Поиск Telegram-чатов — «' + q1 + '»', url: 'https://tgstat.ru/search?q=' + ENC(q1) },
            { label: 'ВКонтакте — поиск «' + q1 + '»', url: 'https://vk.com/search?c%5Bq%5D=' + ENC(q1) },
            { label: 'Обсуждения на форумах — «' + q1 + '»', url: 'https://www.google.com/search?q=' + ENC(q1 + ' форум опыт вопрос') },
            { label: 'Яндекс — «' + q2 + '»', url: 'https://yandex.ru/search/?text=' + ENC(q2) },
            { label: 'Google — «ищу бухгалтера» + ниша', url: 'https://www.google.com/search?q=' + ENC('"ищу бухгалтера" ' + q1) }
          ]
        }
      ];
    }

    function partnersFor(n) {
      var want = n.types.indexOf('ip') !== -1
        ? ['Контур.Эльба', 'Моё дело', 'Т-Банк — Т-Партнёры']
        : ['1С:Фреш — партнёрский канал', 'Т-Банк — Т-Партнёры', 'Точка'];
      return PARTNERS.filter(function (p) { return want.indexOf(p.name) !== -1; });
    }

    /* ── Модал ниши ─────────────────────────────────────────── */
    var lastFocus = null;

    function openNiche(id) {
      var n = findNiche(id);
      var r = rating(n);
      var t = tier(r);
      lastFocus = document.activeElement;
      $('#nm-title').textContent = n.name;
      $('#nm-sub').textContent = n.sphere + ' · ' + n.clientDesc;

      var svc = n.services.map(function (s) {
        return '<li><span>' + esc(s[0]) + '</span><span class="num">' + esc(s[1]) + '</span></li>';
      }).join('');
      var pains = n.pains.map(function (p) { return '<span class="tag">' + esc(p) + '</span>'; }).join('');

      var html = '';
      html += '<div class="row" style="gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">' +
        '<span class="rate-pill num"><span class="rate-dot ' + t + '"></span>' + r.toFixed(1).replace('.', ',') + '<span class="pill-tier">' + TIER_LABEL[t] + '</span></span>' +
        '<span class="meta">рейтинг при ваших текущих весах</span></div>';
      html += '<p class="niche-label">Что болит у клиента</p><div class="pain-tags">' + pains + '</div>';
      html += '<p class="niche-label">Что продавать</p><ul class="svc">' + svc + '</ul>';
      html += '<p class="niche-label">Лид-магнит</p><p class="niche-lead">' + esc(n.lead) + '</p>';
      html += '<p class="niche-note"><strong>Совет:</strong> ' + esc(n.note) + '</p>';

      html += demandPanel(n);

      html += '<p class="niche-label" style="margin-top: 24px;">Партнёрки, подходящие к этой нише</p>';
      partnersFor(n).forEach(function (p) {
        html += '<div class="src-link"><span>' + esc(p.name) + ' — ' + esc(p.rate) + '</span>' +
          '<a class="p-link" style="margin: 0;" href="' + p.url + '" target="_blank" rel="noopener">' + esc(p.urlLabel) + ' ↗</a></div>';
      });

      html += '<p class="niche-label" style="margin-top: 24px;">Выберите путь — что будете делать в этой нише</p>';
      html += '<div class="niche-cta">' +
        '<a class="btn btn-primary btn-sm btn-arrow" href="napravlenie-1.html?niche=' + esc(n.id) + '">Направление 1 · искать клиентов самому</a>' +
        '<a class="btn btn-ink btn-sm btn-arrow" href="napravlenie-2.html?niche=' + esc(n.id) + '">Направление 2 · заработать на партнёрках</a>' +
        '</div>';
      html += '<div class="niche-cta" style="margin-top: 8px;">' +
        '<a class="btn btn-secondary btn-sm btn-arrow" href="offer.html" data-niche="' + esc(n.id) + '" id="nm-to-offer">Собрать оффер</a>' +
        '<a class="btn btn-secondary btn-sm btn-arrow" href="feed.html" id="nm-to-feed">Заявки по этой нише</a>' +
        '</div>';

      $('#nm-body').innerHTML = html;
      $('#nm-to-offer').addEventListener('click', function () {
        $('#ctor-niche').value = n.id;
        renderOffer();
        closeModal();
      });
      $('#nm-to-feed').addEventListener('click', function () {
        var fs = $('#feed-niche');
        if (fs) { fs.value = n.id; feedState.niche = n.id; }
        renderFeed();
        renderFeedGroups();
        closeModal();
      });

      $('#niche-modal').hidden = false;
      document.body.classList.add('no-scroll');
      $('#nm-close').focus();
    }

    function closeModal() {
      $('#niche-modal').hidden = true;
      document.body.classList.remove('no-scroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* ── Конструктор оффера ─────────────────────────────────── */
    function findNiche(id) {
      for (var i = 0; i < NICHES.length; i++) {
        if (NICHES[i].id === id) return NICHES[i];
      }
      return NICHES[0];
    }

    function renderOffer() {
      var sel = $('#ctor-niche');
      if (!sel) return;
      var n = findNiche(sel.value);
      $('#ctor-hook').textContent = n.hook;
      $('#ctor-offer').textContent = n.offer;
      $('#ctor-lead').textContent = n.lead;
      $('#ctor-svc').innerHTML = n.services.map(function (s) {
        return '<li><span>' + esc(s[0]) + '</span><span class="num">' + esc(s[1]) + '</span></li>';
      }).join('');
      $('#ctor-channels').textContent = n.channels.join(' · ');
      $('#ctor-note').textContent = n.note;
    }

    function offerText() {
      var n = findNiche($('#ctor-niche').value);
      var lines = [
        'Заголовок для лендинга: ' + n.hook,
        'Оффер: ' + n.offer,
        'Лид-магнит: ' + n.lead,
        'Услуги и цены:'
      ];
      n.services.forEach(function (s) { lines.push('  • ' + s[0] + ' — ' + s[1]); });
      lines.push('Каналы привлечения: ' + n.channels.join('; '));
      lines.push('Совет: ' + n.note);
      return lines.join('\n');
    }

    function fallbackCopy(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* нет доступа к буферу */ }
      document.body.removeChild(ta);
    }

    /* ── План 30 дней ───────────────────────────────────────── */
    function updatePlan(boxes) {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      var pct = Math.round(done / boxes.length * 100);
      $('#plan-count').textContent = 'Выполнено ' + done + ' из ' + boxes.length;
      var bar = $('#plan-bar-fill');
      if (bar) bar.style.width = pct + '%';
      var pb = $('.plan-bar');
      if (pb) pb.setAttribute('aria-valuenow', String(done));
      store.set(PLAN_KEY, JSON.stringify(boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute('data-plan'); })));
    }

    /* ── Выпадающие списки (пересобираются при обновлении базы) ── */
    function populateSelects() {
      var sphereSel = $('#niche-sphere');
      if (sphereSel) {
        var curSphere = state.sphere;
        var spheres = [];
        NICHES.forEach(function (n) {
          if (spheres.indexOf(n.sphere) === -1) spheres.push(n.sphere);
        });
        spheres.sort(function (a, b) { return a.localeCompare(b, 'ru'); });
        sphereSel.innerHTML = '<option value="all">Все сферы</option>';
        spheres.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          sphereSel.appendChild(opt);
        });
        sphereSel.value = spheres.indexOf(curSphere) !== -1 ? curSphere : 'all';
        state.sphere = sphereSel.value;
      }

      var ctorSel = $('#ctor-niche');
      if (ctorSel) {
        var cur = ctorSel.value;
        ctorSel.innerHTML = '';
        NICHES.forEach(function (n) {
          var opt = document.createElement('option');
          opt.value = n.id;
          opt.textContent = n.name;
          ctorSel.appendChild(opt);
        });
        ctorSel.value = NICHES.some(function (x) { return x.id === cur; }) ? cur : NICHES[0].id;
      }

      var feedSel = $('#feed-niche');
      if (feedSel) {
        var feedCur = feedSel.value;
        feedSel.innerHTML = '<option value="all">Все ниши</option>';
        NICHES.forEach(function (n) {
          var opt = document.createElement('option');
          opt.value = n.id;
          opt.textContent = n.name;
          feedSel.appendChild(opt);
        });
        feedSel.value = NICHES.some(function (x) { return x.id === feedCur; }) ? feedCur : 'all';
        feedState.niche = feedSel.value;
      }
    }

    /* ── Автосинхронизация базы (онлайн, без кнопок) ───────────── */
    var DATA_URL = 'nishabuh-data.json'; /* можно заменить на https://… — тогда обновления идут из облака */
    var SYNC_PERIOD = 10 * 60 * 1000;    /* авто-проверка каждые 10 минут */
    var OFFLINE_RETRY = 60 * 1000;       /* в офлайне повторяем сами раз в минуту */
    var lastSync = 0, nextSync = 0;

    function dataUrlFromPage() {
      try {
        var u = new URLSearchParams(window.location.search).get('data');
        if (u) return u;
      } catch (e) { /* старый браузер — берём значение по умолчанию */ }
      return DATA_URL;
    }

    function fmtTime(ts) {
      try { return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
      catch (e) { return new Date(ts).toTimeString().slice(0, 8); }
    }
    function fmtCountdown(ms) {
      var s = Math.max(0, Math.round(ms / 1000));
      return Math.floor(s / 60) + ' мин ' + ('0' + (s % 60)).slice(-2) + ' с';
    }
    function setSyncDot(cls) {
      $all('.js-sync-dot').forEach(function (el) { el.className = 'rate-dot' + cls; });
    }
    function setSyncText(t) {
      $all('.js-sync-status').forEach(function (el) { el.textContent = t; });
    }
    function setSyncCount(t) {
      $all('.js-sync-count').forEach(function (el) { el.textContent = t; });
    }

    function syncTick() {
      if (!nextSync) return;
      if (Date.now() >= nextSync) { runSync(true); return; }
      var left = nextSync - Date.now();
      setSyncCount(lastSync
        ? 'проверено в ' + fmtTime(lastSync) + ' · следующая через ' + fmtCountdown(left)
        : 'повтор через ' + fmtCountdown(left));
    }

    function applyData(data) {
      try { window.NB_DATA = data; } catch (e) {}
      NICHES = data.niches;
      if (data.partners && data.partners.length && data.partners[0].name) PARTNERS = data.partners;
      if (data.listings && data.listings.length) LISTINGS = data.listings;
      populateSelects();
      renderNiches();
      renderChips();
      renderPartners();
      renderOffer();
      renderFeedChips();
      renderFeed();
      renderFeedGroups();
    }

    function runSync(silent) {
      if (!silent) {
        setSyncDot(' mid');
        setSyncText('Автосинхронизация: проверяю онлайн…');
      }
      if (typeof window.fetch !== 'function') { goOffline(); return; }
      window.fetch(dataUrlFromPage(), { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (data) {
        if (!data || !data.niches || !data.niches.length || !data.niches[0].id || !data.niches[0].s) {
          throw new Error('bad format');
        }
        applyData(data);
        lastSync = Date.now();
        nextSync = lastSync + SYNC_PERIOD;
        setSyncDot(' ok');
        setSyncText('Онлайн · база от ' + (data.generatedAt || '—') + ' · ниш ' + NICHES.length + ', партнёрок ' + PARTNERS.length);
        setSyncCount('проверено в ' + fmtTime(lastSync) + ' · следующая через ' + fmtCountdown(SYNC_PERIOD));
      }).catch(goOffline);
    }

    function goOffline() {
      nextSync = Date.now() + OFFLINE_RETRY;
      setSyncDot('');
      setSyncText('Офлайн-режим: база взята из файла страницы. Автопроверка продолжается и включится сама при открытии через сервер или хостинг.');
      setSyncCount('повтор через ' + fmtCountdown(OFFLINE_RETRY) + ' · интернет-адрес базы можно задать через ?data=…');
    }

    /* ── Боковое меню (разделы-страницы) ────────────────────── */

    /* ── Страничные модули ──────────────────────────────────── */
    function loadWeightsState() {
      var savedW = null;
      try { savedW = JSON.parse(store.get(WEIGHTS_KEY) || 'null'); } catch (e) { savedW = null; }
      if (savedW && typeof savedW === 'object') {
        CRITERIA.forEach(function (c) {
          if (typeof savedW[c.k] === 'number' && savedW[c.k] >= 0) W[c.k] = savedW[c.k];
        });
      }
      $all('.weight-row input[type="range"]').forEach(function (inp) {
        inp.value = W[inp.getAttribute('data-k')];
      });
    }

    function wireNicheControls() {
      $('#niche-search').addEventListener('input', function (e) { state.q = e.target.value; renderNiches(); });
      $all('#niche-client button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.client = b.getAttribute('data-client');
          $all('#niche-client button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          renderNiches();
        });
      });
      $('#niche-sphere').addEventListener('change', function (e) { state.sphere = e.target.value; renderNiches(); });
      $('#niche-sort').addEventListener('change', function (e) { state.sort = e.target.value; renderNiches(); });
      function resetFilters() {
        state.q = ''; state.client = 'all'; state.sphere = 'all'; state.sort = 'rating';
        $('#niche-search').value = '';
        $('#niche-sphere').value = 'all';
        $('#niche-sort').value = 'rating';
        $all('#niche-client button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x.getAttribute('data-client') === 'all'));
        });
        renderNiches();
      }
      $('#reset-all').addEventListener('click', resetFilters);
      $('#niche-reset').addEventListener('click', resetFilters);
      $all('.weight-row input[type="range"]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          W[inp.getAttribute('data-k')] = Number(inp.value);
          clearPresetSelection();
          syncWeights();
          renderNiches();
          saveWeights();
        });
      });
      $all('.preset').forEach(function (b) {
        b.addEventListener('click', function () { applyPreset(b.getAttribute('data-preset')); });
      });
      $('#weights-reset').addEventListener('click', resetWeights);
      $('#niche-grid').addEventListener('click', function (e) {
        var el = e.target, opened = null, toOffer = null;
        while (el && el !== this) {
          if (!opened && el.tagName === 'BUTTON' && el.getAttribute('data-open')) opened = el;
          if (!toOffer && el.tagName === 'A' && el.getAttribute('data-niche')) toOffer = el;
          el = el.parentNode;
        }
        if (opened) { openNiche(opened.getAttribute('data-open')); return; }
        if (toOffer) {
          try { store.set('nb-offer-niche', toOffer.getAttribute('data-niche')); } catch (e2) {}
        }
      });
      $('#nm-close').addEventListener('click', closeModal);
      $('#niche-modal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !$('#niche-modal').hidden) closeModal();
      });
    }

    function wireFeedControls() {
      $('#feed-search').addEventListener('input', function (e) { feedState.q = e.target.value; renderFeed(); });
      $('#feed-niche').addEventListener('change', function (e) {
        feedState.niche = e.target.value;
        renderFeed();
        renderFeedGroups();
      });
      function resetFeed() {
        feedState.q = ''; feedState.platform = 'Все'; feedState.niche = 'all';
        $('#feed-search').value = '';
        $('#feed-niche').value = 'all';
        renderFeedChips();
        renderFeed();
        renderFeedGroups();
      }
      $('#feed-reset').addEventListener('click', resetFeed);
      $('#feed-reset2').addEventListener('click', resetFeed);
    }

    function wireOfferControls() {
      var saved = null;
      try { saved = store.get('nb-offer-niche'); } catch (e) { saved = null; }
      if (saved && NICHES.some(function (x) { return x.id === saved; })) $('#ctor-niche').value = saved;
      renderOffer();
      $('#ctor-niche').addEventListener('change', renderOffer);
      $('#ctor-copy').addEventListener('click', function () {
        var btn = this;
        var done = function () {
          btn.textContent = 'Скопировано';
          window.setTimeout(function () { btn.textContent = 'Скопировать оффер'; }, 2000);
        };
        var text = offerText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    }

    function wirePlanControls() {
      var boxes = $all('.week-card input[type="checkbox"]');
      var savedPlan = [];
      try { savedPlan = JSON.parse(store.get(PLAN_KEY) || '[]'); } catch (e) { savedPlan = []; }
      boxes.forEach(function (b) {
        b.checked = savedPlan.indexOf(b.getAttribute('data-plan')) !== -1;
        b.addEventListener('change', function () { updatePlan(boxes); });
      });
      updatePlan(boxes);
    }

    /* ── Боты и воронки: конструктор конфигурации ───────────── */
    function bxVal(id) { var el = $('#' + id); return el ? el.value : ''; }

    function buildBotConfig() {
      var nid = bxVal('bx-niche');
      var n = nid ? findNiche(nid) : null;
      var menu = bxVal('bx-menu').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var keywords = bxVal('bx-keywords').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      return {
        generated: 'НишаБух · конструктор бота',
        messenger: bxVal('bx-messenger'),
        botName: bxVal('bx-name').trim(),
        niche: n ? n.name : '',
        greeting: bxVal('bx-greeting').trim(),
        leadMagnet: bxVal('bx-lead'),
        menu: menu,
        keywordTrigger: keywords,
        qualification: [
          'Какой режим налогообложения: ИП/ООО, УСН / патент / ОСНО?',
          'Маркетплейсы, касса, наёмные — что уже есть?',
          'Что болит сильнее: налоги, учёт или отчётность?'
        ],
        booking: 'Запись на бесплатную 20-минутную диагностику · окно: ' + (bxVal('bx-hours') || 'по договорённости'),
        leadsTo: bxVal('bx-to').trim(),
        workingHours: bxVal('bx-hours').trim(),
        funnel: ['/start — приветствие', 'выдача лид-магнита', '3 вопроса квалификации', 'запись на диагностику', 'передача заявки в CRM'],
        note: 'Токены бота в этом файле не хранить — только в кабинете платформы.'
      };
    }

    function wireBots() {
      var nicheSel = $('#bx-niche'), leadSel = $('#bx-lead');
      if (nicheSel) {
        NICHES.forEach(function (n) {
          var o = document.createElement('option'); o.value = n.id; o.textContent = n.name; nicheSel.appendChild(o);
        });
      }
      function fillLeads() {
        if (!leadSel) return;
        var nid = nicheSel ? nicheSel.value : '';
        leadSel.innerHTML = '';
        NICHES.forEach(function (n) {
          if (nid && n.id !== nid) return;
          var o = document.createElement('option'); o.value = n.lead; o.textContent = n.lead; leadSel.appendChild(o);
        });
      }
      fillLeads();

      var st = $('#bx-status');
      function txt() { return JSON.stringify(buildBotConfig(), null, 2); }
      function render() {
        var out = $('#bx-out');
        if (out) out.textContent = txt();
      }

      ['bx-messenger', 'bx-name', 'bx-greeting', 'bx-lead', 'bx-menu', 'bx-keywords', 'bx-to', 'bx-hours'].forEach(function (id) {
        var el = $('#' + id);
        if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
      });
      if (nicheSel) nicheSel.addEventListener('change', function () { fillLeads(); render(); });

      try {
        var saved = JSON.parse(store.get('nb-bot-config') || 'null');
        if (saved && typeof saved === 'object') {
          if (saved.messenger) $('#bx-messenger').value = saved.messenger;
          if (saved.niche && nicheSel) { nicheSel.value = saved.niche; fillLeads(); }
          if (saved.leadMagnet && leadSel) leadSel.value = saved.leadMagnet;
          if (saved.botName) $('#bx-name').value = saved.botName;
          if (saved.greeting) $('#bx-greeting').value = saved.greeting;
          if (saved.menu && saved.menu.length) $('#bx-menu').value = saved.menu.join('\n');
          if (saved.keywordTrigger && saved.keywordTrigger.length) $('#bx-keywords').value = saved.keywordTrigger.join(', ');
          if (saved.leadsTo) $('#bx-to').value = saved.leadsTo;
          if (saved.workingHours) $('#bx-hours').value = saved.workingHours;
        }
      } catch (e) { /* приватный режим или пустой конфиг */ }

      render();

      var dl = $('#bx-download');
      if (dl) dl.addEventListener('click', function () {
        var blob = new Blob([txt()], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bot-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        if (st) st.textContent = 'Файл bot-config.json скачан.';
      });

      var cp = $('#bx-copy');
      if (cp) cp.addEventListener('click', function () {
        var done = function () { if (st) st.textContent = 'Конфигурация скопирована.'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt()).then(done, function () { fallbackCopy(txt(), done); });
        } else {
          fallbackCopy(txt(), done);
        }
      });

      var sv = $('#bx-save');
      if (sv) sv.addEventListener('click', function () {
        store.set('nb-bot-config', JSON.stringify(buildBotConfig()));
        if (st) st.textContent = 'Конфигурация сохранена в этом браузере — вернитесь к ней в любой момент.';
      });
    }

    /* ── Старт с нуля: мастер пакета и шаги ─────────────────── */
    function buildUtm(n) {
      var id = n ? n.id : 'niche';
      return '?utm_source=yandex&utm_medium=cpc&utm_campaign=' + id + '&utm_content={ad_id}&utm_term={keyword}';
    }

    function buildStartPackage() {
      var nid = bxVal('st-niche');
      var n = (nid && findNiche(nid)) || NICHES[0];
      return {
        generated: 'НишаБух · стартовый пакет',
        niche: { id: n.id, name: n.name, sphere: n.sphere, client: n.clientDesc },
        offer: { headline: n.hook, offer: n.offer, leadMagnet: n.lead },
        services: n.services,
        search: {
          wordstat: 'https://wordstat.yandex.ru/#!/?words=' + ENC(n.q1),
          avito: 'https://www.avito.ru/all?q=' + ENC(n.q1),
          hh: 'https://hh.ru/search/vacancy?text=' + ENC(n.q1),
          telegram: 'https://tgstat.ru/search?q=' + ENC(n.q1)
        },
        utm: buildUtm(n),
        bot: {
          messenger: 'telegram',
          greeting: 'Здравствуйте! Помогу навести порядок в учёте. Ответьте на 3 вопроса — пришлю разбор и запишу на бесплатную диагностику.',
          leadMagnet: n.lead,
          menu: ['Получить ' + n.lead.toLowerCase(), 'Записаться на диагностику', 'Задать вопрос'],
          qualification: [
            'Режим налогообложения: ИП/ООО, УСН / патент / ОСНО?',
            'Маркетплейсы, касса, наёмные — что уже есть?',
            'Что болит сильнее: налоги, учёт или отчётность?'
          ],
          leadsTo: '@ваш_телеграм'
        },
        taskPlan: ['Упаковка: лендинг + лид-магнит', 'Привлечение: 10 диагностик', 'Автоматизация: бот + рассылка', 'Цель: 3–5 платящих клиентов'],
        note: 'Токены и пароли в файлах не хранить — только в кабинетах сервисов.'
      };
    }

    function wireStart() {
      var nicheSel = $('#st-niche');
      if (nicheSel) {
        NICHES.forEach(function (n) {
          var o = document.createElement('option'); o.value = n.id; o.textContent = n.name; nicheSel.appendChild(o);
        });
        var saved = null;
        try { saved = store.get('nb-start-niche'); } catch (e) { saved = null; }
        if (saved && NICHES.some(function (x) { return x.id === saved; })) nicheSel.value = saved;
      }

      var st = $('#st-status');
      function txt() { return JSON.stringify(buildStartPackage(), null, 2); }
      function esc2(v) { return esc(String(v == null ? '' : v)); }
      function packHtml(p) {
        function li(x) { return '<li>' + esc2(x) + '</li>'; }
        var services = (p.services || []).map(function (s) { return '<li><b>' + esc2(s[0]) + '</b> — ' + esc2(s[1]) + '</li>'; }).join('');
        return '' +
          '<p class="pack-who"><b>Кому продаём:</b> ' + esc2(p.niche.client || '') + ' <span class="meta">(' + esc2(p.niche.sphere || '') + ')</span></p>' +
          '<div class="pack-block"><div class="pack-title">1. Ваш оффер — что вы говорите клиенту</div><p class="pack-offer">' + esc2(p.offer.headline) + '</p><p>' + esc2(p.offer.offer) + '</p></div>' +
          '<div class="pack-block"><div class="pack-title">2. Что дарите за контакт</div><p>' + esc2(p.offer.leadMagnet) + '</p><p class="meta">Человек оставляет телефон — получает подарок. Так начинается разговор.</p></div>' +
          '<div class="pack-block"><div class="pack-title">3. Услуги и цены</div><ul class="pack-list">' + services + '</ul></div>' +
          '<div class="pack-block"><div class="pack-title">4. Где искать клиентов — четыре ссылки</div><ul class="pack-list pack-links">' +
            '<li><a href="' + p.search.wordstat + '" target="_blank" rel="noopener">Сколько людей ищут вас</a> <span class="meta">— Вордстат, частотность запросов</span></li>' +
            '<li><a href="' + p.search.avito + '" target="_blank" rel="noopener">Кто ищет бухгалтера</a> <span class="meta">— объявления на Авито</span></li>' +
            '<li><a href="' + p.search.hh + '" target="_blank" rel="noopener">Кого берут в штат</a> <span class="meta">— вакансии на hh</span></li>' +
            '<li><a href="' + p.search.telegram + '" target="_blank" rel="noopener">Где сидят ваши клиенты</a> <span class="meta">— каналы и чаты, tgstat</span></li>' +
          '</ul></div>' +
          '<div class="pack-block"><div class="pack-title">5. Метка для рекламы</div><p class="meta">Добавляется к ссылке в рекламе, чтобы видеть, откуда пришёл клиент.</p><p class="pack-code">' + esc2(p.utm) + '</p></div>' +
          '<div class="pack-block"><div class="pack-title">6. Что бот пишет клиенту</div>' +
            '<p><b>Приветствие:</b> ' + esc2(p.bot.greeting) + '</p>' +
            '<p><b>Кнопки меню:</b></p><ul class="pack-list">' + (p.bot.menu || []).map(li).join('') + '</ul>' +
            '<p><b>Три вопроса, чтобы понять клиента:</b></p><ol class="pack-list">' + (p.bot.qualification || []).map(li).join('') + '</ol>' +
            '<p><b>Куда приходят заявки:</b> ' + esc2(p.bot.leadsTo) + '</p></div>' +
          '<div class="pack-block"><div class="pack-title">7. План: что делать дальше</div><ol class="pack-list">' + (p.taskPlan || []).map(li).join('') + '</ol></div>' +
          '<p class="meta pack-note">' + esc2(p.note) + '</p>';
      }
      function render() {
        var p = buildStartPackage();
        var out = $('#st-out');
        if (out) out.innerHTML = packHtml(p);
        var tech = $('#st-tech-out');
        if (tech) tech.textContent = JSON.stringify(p, null, 2);
      }
      render();
      if (nicheSel) nicheSel.addEventListener('change', function () {
        store.set('nb-start-niche', nicheSel.value);
        render();
      });

      function download(name, text) {
        var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }
      function copyText(text, msg) {
        var done = function () { if (st) st.textContent = msg; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        else fallbackCopy(text, done);
      }

      var b = $('#st-build');
      if (b) b.addEventListener('click', function () {
        var p = buildStartPackage();
        render();
        if (st) st.textContent = 'Пакет собран: ' + p.niche.name + ' — оффер, услуги, ссылки и UTM готовы.';
      });
      var d = $('#st-download');
      if (d) d.addEventListener('click', function () { download('start-package.json', txt()); if (st) st.textContent = 'Файл start-package.json скачан.'; });
      var c = $('#st-copy');
      if (c) c.addEventListener('click', function () { copyText(txt(), 'Стартовый пакет скопирован.'); });

      var co = $('#st-copy-offer');
      if (co) co.addEventListener('click', function () {
        var p = buildStartPackage();
        copyText(p.offer.headline + '\n' + p.offer.offer + '\nЛид-магнит: ' + p.offer.leadMagnet, 'Оффер скопирован — вставляйте в лендинг.');
      });
      var u = $('#st-utm');
      if (u) u.addEventListener('click', function () {
        var p = buildStartPackage();
        copyText(p.utm, 'UTM-метка скопирована: ' + p.utm);
      });
      var bo = $('#st-bot');
      if (bo) bo.addEventListener('click', function () {
        var p = buildStartPackage();
        download('bot-config.json', JSON.stringify({ generated: 'НишаБух · конфиг бота', messenger: p.bot.messenger, niche: p.niche.name, greeting: p.bot.greeting, leadMagnet: p.bot.leadMagnet, menu: p.bot.menu, qualification: p.bot.qualification, leadsTo: p.bot.leadsTo }, null, 2));
        if (st) st.textContent = 'Файл bot-config.json скачан.';
      });

      /* шаги: отметки + прогресс */
      var boxes = $all('.step-check input[type="checkbox"]');
      var savedSteps = [];
      try { savedSteps = JSON.parse(store.get('nb-start-steps') || '[]'); } catch (e) { savedSteps = []; }
      function updateProgress() {
        var done = boxes.filter(function (x) { return x.checked; }).length;
        var cnt = $('#st-count');
        if (cnt) cnt.textContent = 'Выполнено ' + done + ' из ' + boxes.length + ' шагов';
        var bar = $('#st-bar');
        if (bar) bar.style.width = Math.round(done / Math.max(1, boxes.length) * 100) + '%';
        var pb = $('.plan-bar[aria-label="Прогресс старта"]');
        if (pb) pb.setAttribute('aria-valuenow', String(done));
        store.set('nb-start-steps', JSON.stringify(boxes.filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-step'); })));
      }
      boxes.forEach(function (x) {
        x.checked = savedSteps.indexOf(x.getAttribute('data-step')) !== -1;
        x.addEventListener('change', updateProgress);
      });
      updateProgress();
    }


    /* ── Оформление: тема, акцент, размер текста ───────────── */
    var THEME_KEY = 'nb-appearance';
    var ACCENTS = [
      ['#3f8cff', 'Синий'], ['#2fbf71', 'Зелёный'], ['#8b5cf6', 'Фиолетовый'],
      ['#f59e0b', 'Оранжевый'], ['#06b6d4', 'Бирюзовый'], ['#ef4444', 'Красный']
    ];
    function themeState() {
      var t = {};
      try { t = JSON.parse(store.get(THEME_KEY) || '{}') || {}; } catch (e) { t = {}; }
      return t;
    }
    function applyAppearance() {
      var t = themeState();
      var root = document.documentElement;
      root.classList.toggle('theme-dark', t.mode === 'dark');
      root.classList.toggle('fs-large', t.size === 'large');
      if (t.accent) root.style.setProperty('--accent', t.accent);
      var acc = (t.accent || '#3f8cff').toLowerCase();
      $all('.swatch').forEach(function (s) { s.setAttribute('aria-pressed', String((s.getAttribute('data-color') || '').toLowerCase() === acc)); });
      $all('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String((t.mode === 'dark' ? 'dark' : 'light') === b.getAttribute('data-mode'))); });
      $all('[data-size]').forEach(function (b) { b.setAttribute('aria-pressed', String((t.size || 'normal') === b.getAttribute('data-size'))); });
    }
    function saveAppearance(patch) {
      var t = themeState();
      Object.keys(patch).forEach(function (k) { t[k] = patch[k]; });
      store.set(THEME_KEY, JSON.stringify(t));
      applyAppearance();
    }
    function themeControlsHtml() {
      var t = themeState();
      var mode = t.mode === 'dark' ? 'dark' : 'light';
      var size = t.size || 'normal';
      return '<div class="theme-row"><span class="meta">Тема</span><div class="seg-inline">' +
        '<button type="button" data-mode="light" aria-pressed="' + (mode !== 'dark') + '">Светлая</button>' +
        '<button type="button" data-mode="dark" aria-pressed="' + (mode === 'dark') + '">Тёмная</button></div></div>' +
        '<div class="theme-row"><span class="meta">Акцентный цвет</span><div class="swatches">' +
        ACCENTS.map(function (a) { return '<button type="button" class="swatch" data-color="' + a[0] + '" title="' + a[1] + '" aria-label="' + a[1] + '" style="background: ' + a[0] + '"></button>'; }).join('') +
        '</div></div>' +
        '<div class="theme-row"><span class="meta">Размер текста</span><div class="seg-inline">' +
        '<button type="button" data-size="normal" aria-pressed="' + (size === 'normal') + '">Обычный</button>' +
        '<button type="button" data-size="large" aria-pressed="' + (size === 'large') + '">Крупнее</button></div></div>' +
        '<div class="theme-row"><button type="button" class="btn btn-secondary btn-sm theme-reset">Сбросить оформление</button></div>';
    }
    function wireAppearance() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn';
      btn.textContent = 'Оформление';
      var panel = document.createElement('div');
      panel.className = 'theme-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Настройки оформления');
      panel.innerHTML = themeControlsHtml();
      document.body.appendChild(btn);
      document.body.appendChild(panel);
      btn.addEventListener('click', function () { panel.classList.toggle('open'); });
      document.addEventListener('click', function (e) {
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && e.target !== inlineBtn) panel.classList.remove('open');
        var t = e.target;
        if (!t || !t.getAttribute) return;
        if (t.getAttribute('data-mode')) saveAppearance({ mode: t.getAttribute('data-mode') });
        else if (t.getAttribute('data-size')) saveAppearance({ size: t.getAttribute('data-size') });
        else if (t.getAttribute('data-color')) saveAppearance({ accent: t.getAttribute('data-color') });
        else if (t.classList && t.classList.contains('theme-reset')) {
          store.set(THEME_KEY, '{}');
          document.documentElement.style.removeProperty('--accent');
          applyAppearance();
        }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') panel.classList.remove('open'); });
      var inlineBtn = document.createElement('button');
      inlineBtn.type = 'button';
      inlineBtn.className = 'theme-btn-inline';
      inlineBtn.textContent = 'Оформление';
      var sideFoot2 = $('.side-foot');
      if (sideFoot2) sideFoot2.appendChild(inlineBtn);
      inlineBtn.addEventListener('click', function () { panel.classList.toggle('open'); });
      var slot = $('#theme-slot');
      if (slot) slot.innerHTML = themeControlsHtml();
      applyAppearance();
    }

    /* ── Запуск ─────────────────────────────────────────────── */
        function wireDirections() {
      var banner = $('#dir-banner');
      if (!banner) return;
      var id = null;
      try { id = new URLSearchParams(window.location.search).get('niche'); } catch (e) { id = null; }
      var n = id ? findNiche(id) : null;
      if (!n) return;
      var nm = $('#dir-niche-name'); if (nm) nm.textContent = n.name;
      var sp = $('#dir-niche-sphere'); if (sp) sp.textContent = n.sphere ? '· ' + n.sphere : '';
      var to = $('#dir-to-offer'); if (to) to.setAttribute('data-niche', n.id);
      var sel = $('#ctor-niche'); if (sel) sel.value = n.id;
      banner.hidden = false;
    }
function init() {
      var page = document.body.getAttribute('data-page') || 'index';
      applyAppearance();
      wireAppearance();

      if (page === 'niches') {
        populateSelects();
        loadWeightsState();
        wireNicheControls();
        syncWeights();
        renderNiches();
      }
      if (page === 'feed') {
        populateSelects();
        renderFeedChips();
        renderFeed();
        renderFeedGroups();
        wireFeedControls();
      }
      if (page === 'partners') {
        renderChips();
        renderPartners();
      }
      if (page === 'offer') {
        populateSelects();
        wireOfferControls();
      }
      if (page === 'plan') {
        wirePlanControls();
      }
      if (page === 'bots') {
        wireBots();
      }
      if (page === 'start') {
        wireStart();
      wireDirections();
      }

      /* автосинхронизация базы: без кнопок, общая для всех страниц */
      runSync(false);
      window.setInterval(syncTick, 1000);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && nextSync && Date.now() >= nextSync) runSync(true);
      });

      var toTop = $('.to-top');
      if (toTop) {
        window.addEventListener('scroll', function () {
          toTop.classList.toggle('show', window.scrollY > 600);
        }, { passive: true });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
