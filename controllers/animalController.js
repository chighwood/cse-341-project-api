const { handleErrors } = require('./errorController');
const Joi = require('joi');
const Animal = require('../models/animalModel');
const mongoose = require('mongoose');

// Validation schema for creating an animal
const animalSchema = Joi.object({
  name: Joi.string().min(3).required(),
  species: Joi.string().required(),
  habitat: Joi.string().required(),
  extinct: Joi.boolean().required()
});

// Validation schema for updating an animal
const animalSchemaForUpdate = Joi.object({
  name: Joi.string().min(3).optional(),
  species: Joi.string().optional(),
  habitat: Joi.string().optional(),
  extinct: Joi.boolean().optional()
});

// Create a new animal
exports.createAnimal = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  /* #swagger.parameters['body'] = {
      in: 'body',
      description: 'Animal details to create',
      required: true,
      schema: {
          name: 'Sample Animal',
          species: 'Mammal',
          habitat: 'Forest',
          extinct: false
      }
  } */
  const { error } = animalSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const animal = new Animal(req.body);
    await animal.save();
    res.status(201).json(animal);
  } catch {
    res.status(500).json({ error: 'Error creating animal' });
  }
});

// Update an animal
exports.updateAnimal = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  /* #swagger.parameters['body'] = {
      in: 'body',
      description: 'Animal details to update',
      schema: {
          name: 'Updated Animal Name',
          species: 'Reptile',
          habitat: 'Desert',
          extinct: true
      }
  } */
  const { animalId } = req.params;
  const { error } = animalSchemaForUpdate.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const updatedAnimal = await Animal.findByIdAndUpdate(animalId, req.body, { new: true });
    if (!updatedAnimal) return res.status(404).json({ error: 'Animal not found' });
    res.json(updatedAnimal);
  } catch {
    res.status(500).json({ error: 'Error updating animal' });
  }
});

// Get all animals
exports.getAllAnimals = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  try {
    const animals = await Animal.find();
    res.status(200).json(animals);
  } catch {
    res.status(500).json({ error: 'Error fetching animals' });
  }
});

// Get a single animal by ID
exports.getAnimalById = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  //#swagger.parameters['animalId'] = { description: 'ID of the animal to retrieve' }
  const { animalId } = req.params;

  if (!mongoose.isValidObjectId(animalId)) {
    return res.status(400).json({ error: 'Invalid animal ID format.' });
  }

  try {
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found.' });
    }
    res.status(200).json(animal);
  } catch {
    res.status(500).json({ error: 'Error retrieving animal.' });
  }
});

// Delete an animal by ID
exports.deleteAnimal = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  //#swagger.parameters['animalId'] = { description: 'ID of the animal to delete' }
  const { animalId } = req.params;
  try {
    const animal = await Animal.findByIdAndDelete(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found.' });
    }
    res.status(200).json({ message: 'Animal deleted successfully.' });
  } catch {
    res.status(500).json({ error: 'Error deleting animal.' });
  }
});

exports.searchAnimals = handleErrors(async (req, res) => {
  //#swagger.tags=['Animal']
  /* #swagger.parameters['body'] = {
      in: 'body',
      description: 'Body with search parameters for animals',
      required: false,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          habitat: { type: 'string' },
          extinct: { type: 'boolean' }
        }
      }
  } */
  const { name, habitat, extinct } = req.body;
  const query = {};

  if (name) query.name = { $regex: name, $options: 'i' };
  if (habitat) query.habitat = { $regex: habitat, $options: 'i' };
  if (typeof extinct === 'boolean') {
    query.extinct = extinct;
  }

  try {
    const animals = await Animal.find(query);
    res.status(200).json(animals);
  } catch (err) {
    res.status(500).json({ error: 'Error searching animals.', details: err.message });
  }
});