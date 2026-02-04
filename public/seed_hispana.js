// seed_hispana.js — ejecuta UNA vez desde app.html (botón “Inicializar Sistema”)

async function seedHispañaOrgConfig() {
  const firestore = db();

  const config = {
    branches: [
      { id: "ETH", name: "Ejército de Tierra Hispano", lema: "Por Dios, por la Patria y el Rey" },
      { id: "EAEH", name: "Ejército del Aire y del Espacio Hispano", lema: "Per Aspera Ad Astra" },
      { id: "ARM", name: "Armada Hispana", lema: "Navigare Necesse Est" },
      { id: "PMH", name: "Policía Militar Hispana", lema: "Disciplina y Honor" },
      { id: "GCH", name: "Guardia Civil Hispana", lema: "El Honor es mi Divisa" },
      { id: "CUM", name: "Centro Unificado de Mando", lema: "Unidad de Mando" }
    ],

    // rankLevel: cuanto más alto, más poder.
    // rankId: estable para permisos.
    ranks: {
      ETH: [
        // Generales (5)
        { id:"capitan_general", name:"Capitán General", level:21, group:"Generales" },
        { id:"general_ejercito", name:"General del Ejército", level:20, group:"Generales" },
        { id:"teniente_general", name:"Teniente General", level:19, group:"Generales" },
        { id:"general_division", name:"General de División", level:18, group:"Generales" },
        { id:"general_brigada", name:"General de Brigada", level:17, group:"Generales" },

        // Oficiales (6)
        { id:"coronel", name:"Coronel", level:16, group:"Oficiales" },
        { id:"tcol", name:"Teniente Coronel", level:15, group:"Oficiales" },
        { id:"comandante", name:"Comandante", level:14, group:"Oficiales" },
        { id:"capitan", name:"Capitán", level:13, group:"Oficiales" },
        { id:"teniente", name:"Teniente", level:12, group:"Oficiales" },
        { id:"alferez", name:"Alférez", level:11, group:"Oficiales" },

        // Suboficiales (5)
        { id:"subof_mayor", name:"Suboficial Mayor", level:10, group:"Suboficiales" },
        { id:"subteniente", name:"Subteniente", level:9, group:"Suboficiales" },
        { id:"brigada", name:"Brigada", level:8, group:"Suboficiales" },
        { id:"sargento_primero", name:"Sargento Primero", level:7, group:"Suboficiales" },
        { id:"sargento", name:"Sargento", level:6, group:"Suboficiales" },

        // Tropa (5)
        { id:"cabo_mayor", name:"Cabo Mayor", level:5, group:"Tropa" },
        { id:"cabo_primero", name:"Cabo Primero", level:4, group:"Tropa" },
        { id:"cabo", name:"Cabo", level:3, group:"Tropa" },
        { id:"soldado_primera", name:"Soldado de Primera", level:2, group:"Tropa" },
        { id:"soldado", name:"Soldado", level:1, group:"Tropa" }
      ],

      // EAEH: generales propios + resto igual a ETH (simplificamos reutilizando)
      EAEH: [
        { id:"general_aire", name:"General del Aire", level:20, group:"Generales" },
        { id:"teniente_general_aire", name:"Teniente General del Aire", level:19, group:"Generales" },
        { id:"general_division_aerea", name:"General de División Aérea", level:18, group:"Generales" },
        { id:"general_brigada_aerea", name:"General de Brigada Aérea", level:17, group:"Generales" },
        // “estructura como Tierra”:
        { id:"coronel", name:"Coronel", level:16, group:"Oficiales" },
        { id:"tcol", name:"Teniente Coronel", level:15, group:"Oficiales" },
        { id:"comandante", name:"Comandante", level:14, group:"Oficiales" },
        { id:"capitan", name:"Capitán", level:13, group:"Oficiales" },
        { id:"teniente", name:"Teniente", level:12, group:"Oficiales" },
        { id:"alferez", name:"Alférez", level:11, group:"Oficiales" },
        { id:"subof_mayor", name:"Suboficial Mayor", level:10, group:"Suboficiales" },
        { id:"subteniente", name:"Subteniente", level:9, group:"Suboficiales" },
        { id:"brigada", name:"Brigada", level:8, group:"Suboficiales" },
        { id:"sargento_primero", name:"Sargento Primero", level:7, group:"Suboficiales" },
        { id:"sargento", name:"Sargento", level:6, group:"Suboficiales" },
        { id:"cabo_mayor", name:"Cabo Mayor", level:5, group:"Tropa" },
        { id:"cabo_primero", name:"Cabo Primero", level:4, group:"Tropa" },
        { id:"cabo", name:"Cabo", level:3, group:"Tropa" },
        { id:"soldado_primera", name:"Soldado de Primera", level:2, group:"Tropa" },
        { id:"soldado", name:"Soldado", level:1, group:"Tropa" }
      ],

      ARM: [
        { id:"almirante_general", name:"Almirante General", level:20, group:"Generales" },
        { id:"almirante", name:"Almirante", level:19, group:"Generales" },
        { id:"vicealmirante", name:"Vicealmirante", level:18, group:"Generales" },
        { id:"contralmirante", name:"Contralmirante", level:17, group:"Generales" },

        { id:"capitan_navio", name:"Capitán de Navío", level:16, group:"Oficiales" },
        { id:"capitan_fragata", name:"Capitán de Fragata", level:15, group:"Oficiales" },
        { id:"capitan_corbeta", name:"Capitán de Corbeta", level:14, group:"Oficiales" },
        { id:"teniente_navio", name:"Teniente de Navío", level:13, group:"Oficiales" },
        { id:"alferez_navio", name:"Alférez de Navío", level:12, group:"Oficiales" },
        { id:"alferez_fragata", name:"Alférez de Fragata", level:11, group:"Oficiales" },

        // “similar a Ejército” (simplificamos usando la misma escala de subof/tropa)
        { id:"subof_mayor", name:"Suboficial Mayor", level:10, group:"Suboficiales" },
        { id:"subteniente", name:"Subteniente", level:9, group:"Suboficiales" },
        { id:"brigada", name:"Brigada", level:8, group:"Suboficiales" },
        { id:"sargento_primero", name:"Sargento Primero", level:7, group:"Suboficiales" },
        { id:"sargento", name:"Sargento", level:6, group:"Suboficiales" },

        { id:"cabo_mayor", name:"Cabo Mayor", level:5, group:"Marinería" },
        { id:"cabo_primero", name:"Cabo Primero", level:4, group:"Marinería" },
        { id:"cabo", name:"Cabo", level:3, group:"Marinería" },
        { id:"marinero_primera", name:"Marinero de Primera", level:2, group:"Marinería" },
        { id:"marinero", name:"Marinero", level:1, group:"Marinería" }
      ],

      PMH: [], // la igualamos a ETH en UI (mismo set)
      GCH: [
        { id:"general_director", name:"General Director", level:20, group:"Oficiales" },
        { id:"coronel", name:"Coronel", level:16, group:"Oficiales" },
        { id:"tcol", name:"Teniente Coronel", level:15, group:"Oficiales" },
        { id:"comandante", name:"Comandante", level:14, group:"Oficiales" },
        { id:"capitan", name:"Capitán", level:13, group:"Oficiales" },
        { id:"teniente", name:"Teniente", level:12, group:"Oficiales" },
        { id:"alferez", name:"Alférez", level:11, group:"Oficiales" },

        { id:"subof_mayor", name:"Suboficial Mayor", level:10, group:"Intervención" },
        { id:"suboficial", name:"Suboficial", level:9, group:"Intervención" },
        { id:"cabo_mayor", name:"Cabo Mayor", level:8, group:"Intervención" },
        { id:"cabo_primero", name:"Cabo Primero", level:7, group:"Intervención" },
        { id:"cabo", name:"Cabo", level:6, group:"Intervención" },
        { id:"gc_primera", name:"Guardia Civil Primera", level:5, group:"Intervención" },
        { id:"gc", name:"Guardia Civil", level:4, group:"Intervención" }
      ]
    },

    permissions: {
      // reglas iniciales (ajustables)
      canCreateUnitsMinLevel: 12,      // Teniente+
      canPromoteMinLevel: 14,          // Comandante+
      highCommandMinLevel: 17,         // Generales
      canPublishOrdersMinLevel: 11,    // Alférez+
      canAccessCUMMinLevel: 12
    }
  };

  // PMH = ETH
  config.ranks.PMH = config.ranks.ETH.map(r => ({...r}));

  await firestore.collection("org_config").doc("main").set(config, { merge: true });

  alert("✅ Org_config de Hispaña creado.");
}
