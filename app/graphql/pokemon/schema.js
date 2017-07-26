import axios from 'axios'
import { PubSub, withFilter } from 'graphql-subscriptions'

import { getGenerationByIdLoader } from '../../dataloader'
import {
  getPokemon,
  getPokemonById
} from '../../services/pokemonService'

const pubsub = new PubSub();

const typeDefs = `
  type Pokemon {
    id: String!
    name: String!
    nameJP: String!
    type: [String]
    species: String
    height: Float
    weight: Float
    generationId: Int!
    generation: Generation
  }

  type PokemonsPayload {
    meta: Meta,
    data: [Pokemon],
    errors: [Error]
  }

  type PokemonPayload {
    meta: Meta,
    data: Pokemon,
    errors: [Error]
  }

  input PokemonInput {
    id: String!
    name: String!
    nameJP: String!
    type: [String]
    species: String
    height: Float
    weight: Float
    generationId: Int!
  }
`

const query = `
  getPokemon: PokemonsPayload
  getPokemonById(id: String!): PokemonPayload
`

const mutation = `
  addPokemon(input: PokemonInput): Pokemon
  editPokemon(input: PokemonInput): Pokemon
  deletePokemon(
    id: String!
  ): Meta
`

const subscription = `
  pokemonCreated: Pokemon
`

const resolvers = {
  Query: {
    getPokemon: (root, args, context) => {
      return getPokemon() 
      .then(result => {
        return {
          meta: {
            status: 200,
          },
          data: result.data,
          errors: []
        }
      })
    },
    getPokemonById: (root, args, context) => {
      return getPokemonById(args.id)
      .then(result => {
        return {
          meta: {
            status: 200,
          },
          data: result.data,
          errors: []
        }
      })
    },
  },
  Mutation: {
    addPokemon: (root, args, context) => {
      return axios.post('http://localhost:3002/pokemon', args.input)
      .then(result => {
        pubsub.publish('pokemonCreated', { pokemonCreated: result.data });
        return result.data
      })
    },
    editPokemon: (root, args, context) => {
      return axios.patch(`http://localhost:3002/pokemon/${args.input.id}`, args.input)
      .then(result => result.data)
    },
    deletePokemon: (root, args, context) => {
      return axios.delete(`http://localhost:3002/pokemon/${args.id}`, {})
      .then(result => ({
        status: 200,
        message: 'success'
      }))
    },
  },
  Subscription: {
    pokemonCreated: {
      subscribe: () => pubsub.asyncIterator('pokemonCreated')
    }
  },
  Pokemon: {
    generation: (root) => {
      return axios.get(`http://localhost:3002/generation/${root.generationId}`, {})
      .then(result => result.data)
    }
  }
}

export  {
  typeDefs,
  query,
  mutation,
  subscription,
  resolvers
}