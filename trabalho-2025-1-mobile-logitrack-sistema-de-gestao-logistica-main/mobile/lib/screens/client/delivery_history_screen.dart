import 'package:flutter/material.dart';

class DeliveryHistoryScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery History'),
        backgroundColor: Colors.orangeAccent,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: ListView.builder(
          itemCount: 10,
          itemBuilder: (context, index) {
            return Card(
              margin: EdgeInsets.symmetric(vertical: 10),
              child: ListTile(
                title: Text('Delivery ${index + 1}'),
                subtitle: Text('Status: Completed'),
                trailing: Icon(Icons.arrow_forward),
              ),
            );
          },
        ),
      ),
    );
  }
}
