const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['fr'], forceNER: true });

// Entraînement de base (à compléter)
manager.addDocument('fr', 'Tu es stupide', 'toxic');
manager.addDocument('fr', 'Je te déteste', 'toxic');
manager.addDocument('fr', 'Merci beaucoup', 'clean');
manager.addDocument('fr', 'Excellent travail', 'clean');

// Entités pour détection spécifique
manager.addNamedEntityText('insulte', 'idiot', ['fr'], ['idiot', 'imbécile', 'crétin']);

async function trainModel() {
  await manager.train();
  manager.save('./model.nlp');
  console.log('Modèle entraîné et sauvegardé');
}

module.exports = { manager, trainModel }; 
