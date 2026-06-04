type SystemModule = {
  name: string;
  init: () => any;
};

const modules: SystemModule[] = [];

/**
 * Registra um novo módulo no Master System.
 */
export function registerModule(mod: SystemModule) {
  modules.push(mod);
}

/**
 * Inicializa todos os módulos registrados.
 * Deve ser chamado apenas no Client-Side.
 */
export function initMasterSystem() {
  if (typeof window === "undefined") return;

  modules.forEach((mod) => {
    try {
      mod.init();
    } catch (error) {
      console.error(`[Master System] Falha ao inicializar o módulo ${mod.name}:`, error);
    }
  });
}
