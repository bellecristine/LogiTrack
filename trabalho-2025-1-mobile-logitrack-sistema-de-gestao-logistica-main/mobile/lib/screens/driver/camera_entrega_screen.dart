import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class CameraEntregaScreen extends StatefulWidget {
  final String entregaId;

  const CameraEntregaScreen({super.key, required this.entregaId});

  @override
  State<CameraEntregaScreen> createState() => _CameraEntregaScreenState();
}

class _CameraEntregaScreenState extends State<CameraEntregaScreen> {
  CameraController? _controller;
  XFile? _foto;
  Position? _posicao;

  @override
  void initState() {
    super.initState();
    _inicializarCamera();
  }

  Future<void> _inicializarCamera() async {
    final cameras = await availableCameras();
    _controller = CameraController(cameras[0], ResolutionPreset.medium);
    await _controller!.initialize();
    setState(() {});
  }

  Future<void> _tirarFoto() async {
    _foto = await _controller?.takePicture();
    _posicao = await Geolocator.getCurrentPosition();

    if (_foto != null && _posicao != null) {
      await _enviarEntregaFinalizada();
    }
  }

  Future<void> _enviarEntregaFinalizada() async {
    final uri = Uri.parse(
        'http://10.0.2.2:3000/entregas/${widget.entregaId}/finalizar');

    final request = http.MultipartRequest('POST', uri);
    request.fields['latitude'] = _posicao!.latitude.toString();
    request.fields['longitude'] = _posicao!.longitude.toString();
    request.files.add(await http.MultipartFile.fromPath('foto', _foto!.path));

    final resposta = await request.send();

    if (resposta.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Entrega registrada com sucesso!')),
      );
      Navigator.pop(context); // volta para tela anterior
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao registrar entrega.')),
      );
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Entrega')),
      body: Column(
        children: [
          AspectRatio(
            aspectRatio: _controller!.value.aspectRatio,
            child: CameraPreview(_controller!),
          ),
          ElevatedButton(
            onPressed: _tirarFoto,
            child: const Text('Tirar Foto da Entrega'),
          ),
        ],
      ),
    );
  }
}
