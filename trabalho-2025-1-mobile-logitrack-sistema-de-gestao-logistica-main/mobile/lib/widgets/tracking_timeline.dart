import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/tracking_update.dart';

class TrackingTimeline extends StatelessWidget {
  final List<TrackingUpdate> updates;

  const TrackingTimeline({
    Key? key,
    required this.updates,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (updates.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Text(
            'Nenhuma atualização de rastreamento disponível',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    // Ordenar updates por timestamp (mais recente primeiro)
    final sortedUpdates = List<TrackingUpdate>.from(updates)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sortedUpdates.length,
      itemBuilder: (context, index) {
        final update = sortedUpdates[index];
        final isLast = index == sortedUpdates.length - 1;

        return _TimelineItem(
          update: update,
          isLast: isLast,
        );
      },
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TrackingUpdate update;
  final bool isLast;

  const _TimelineItem({
    Key? key,
    required this.update,
    required this.isLast,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: _getStatusColor(update.status),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    _getStatusIcon(update.status),
                    size: 8,
                    color: Colors.white,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Colors.grey[300],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                bottom: isLast ? 0 : 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status and time
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _getStatusText(update.status),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        DateFormat('dd/MM/yyyy HH:mm').format(update.timestamp),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Location
                  if (update.location.address.isNotEmpty)
                    Text(
                      update.location.address,
                      style: TextStyle(
                        color: Colors.grey[700],
                        fontSize: 14,
                      ),
                    ),
                  // Description
                  if (update.description != null && update.description!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        update.description!,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ),
                  // Photo if available
                  if (update.photoUrl != null && update.photoUrl!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          update.photoUrl!,
                          height: 100,
                          width: 100,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 100,
                              width: 100,
                              decoration: BoxDecoration(
                                color: Colors.grey[200],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.broken_image,
                                color: Colors.grey,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'picked_up':
      case 'in_transit':
        return Colors.blue;
      case 'out_for_delivery':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Icons.access_time;
      case 'picked_up':
        return Icons.inventory;
      case 'in_transit':
        return Icons.local_shipping;
      case 'out_for_delivery':
        return Icons.delivery_dining;
      case 'delivered':
        return Icons.check;
      case 'cancelled':
      case 'failed':
        return Icons.close;
      default:
        return Icons.radio_button_unchecked;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendente';
      case 'picked_up':
        return 'Coletado';
      case 'in_transit':
        return 'Em Trânsito';
      case 'out_for_delivery':
        return 'Saiu para Entrega';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      case 'failed':
        return 'Falha na Entrega';
      default:
        return status.replaceAll('_', ' ').toUpperCase();
    }
  }
} 