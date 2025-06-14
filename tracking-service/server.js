#!/usr/bin/env node

/**
 * LogiTrack Tracking Service
 * Microserviço de rastreamento em tempo real para o sistema LogiTrack
 */

const { app, server, io } = require('./src/app');

// O app.js já contém a lógica de inicialização
// Este arquivo serve apenas como ponto de entrada 