import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Clipboard from '@react-native-clipboard/clipboard';
import { NavigationProps, ParsedBarcode } from '../types';
import { parseBarcode } from '../utils/productParser';

const { width: screenWidth } = Dimensions.get('window');

const POSSystemScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [parsedProduct, setParsedProduct] = useState<ParsedBarcode | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // 檢查相機權限
  const checkCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await check(permission);
      
      switch (result) {
        case RESULTS.UNAVAILABLE:
          Alert.alert('錯誤', '此設備不支援相機功能');
          return false;
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          if (requestResult === RESULTS.GRANTED) {
            return true;
          } else {
            Alert.alert('權限被拒絕', '需要相機權限才能使用掃描功能');
            return false;
          }
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
          return true;
        case RESULTS.BLOCKED:
          Alert.alert(
            '權限被阻擋', 
            '相機權限已被阻擋，請在設定中開啟相機權限',
            [
              { text: '取消', style: 'cancel' },
              { text: '開啟設定', onPress: () => {
                Linking.openSettings();
              }}
            ]
          );
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      Alert.alert('錯誤', '檢查相機權限時發生錯誤');
      return false;
    }
  };

  const handleManualInput = () => {
    if (!manualInput.trim()) {
      Alert.alert('錯誤', '請輸入條碼內容');
      return;
    }
    const parsed = parseBarcode(manualInput);
    setScannedData(manualInput);
    setParsedProduct(parsed);
    setShowResultModal(true);
  };

  const handleScanAgain = () => {
    setScannedData('');
    setParsedProduct(null);
    setManualInput('');
    setShowResultModal(false);
    setShowCameraModal(false);
  };

  const handleCameraScan = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      setShowCameraModal(true);
    }
  };

  const onBarcodeRead = (event: any) => {
    console.log('Barcode read event:', event);
    const { data } = event;
    if (data) {
      const parsed = parseBarcode(data);
      setScannedData(data);
      setParsedProduct(parsed);
      setShowCameraModal(false);
      setShowResultModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('mainSelect')}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>POS系統</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>條碼掃描</Text>
          <Text style={styles.sectionDescription}>
            選擇手動輸入或使用相機掃描商品條碼
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.scanButton, styles.manualButton]}
              onPress={() => setShowResultModal(true)}
            >
              <Text style={styles.scanButtonIcon}>⌨️</Text>
              <Text style={styles.scanButtonText}>手動輸入</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanButton, styles.cameraButton]}
              onPress={handleCameraScan}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>相機掃描</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>產品管理</Text>
          <Text style={styles.sectionDescription}>
            查看產品資訊和生成條碼
          </Text>
          
          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => navigation.navigate('productManagement')}
          >
            <Text style={styles.managementButtonIcon}>📋</Text>
            <Text style={styles.managementButtonText}>產品管理</Text>
          </TouchableOpacity>
        </View>

        {scannedData && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>掃描結果</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>條碼內容:</Text>
              <Text style={styles.resultData}>{scannedData}</Text>
            </View>
            
            {parsedProduct && (
              <View style={styles.productInfoCard}>
                <Text style={styles.productInfoTitle}>產品資訊</Text>
                {parsedProduct.isValid ? (
                  <View style={styles.productInfoTable}>
                    <View style={styles.productInfoRow}>
                      <Text style={styles.productInfoLabel}>產品類別:</Text>
                      <Text style={styles.productInfoValue}>{parsedProduct.categoryName} ({parsedProduct.category})</Text>
                    </View>
                    <View style={styles.productInfoRow}>
                      <Text style={styles.productInfoLabel}>產品代碼:</Text>
                      <Text style={styles.productInfoValue}>{parsedProduct.productCode}</Text>
                    </View>
                    <View style={styles.productInfoRow}>
                      <Text style={styles.productInfoLabel}>產品名稱:</Text>
                      <Text style={styles.productInfoValue}>{parsedProduct.productName}</Text>
                    </View>
                    <View style={styles.productInfoRow}>
                      <Text style={styles.productInfoLabel}>生產日期:</Text>
                      <Text style={styles.productInfoValue}>{parsedProduct.formattedDate}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>❌ {parsedProduct.error}</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(scannedData);
                    Alert.alert('成功', '條碼已複製到剪貼簿！');
                  }}
                >
                  <Text style={styles.copyButtonText}>📋 複製條碼</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 手動輸入 Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {scannedData ? '掃描結果' : '手動輸入條碼'}
            </Text>
            
            {!scannedData && (
              <TextInput
                style={styles.modalInput}
                placeholder="輸入條碼內容"
                value={manualInput}
                onChangeText={setManualInput}
                autoFocus={true}
                multiline={true}
              />
            )}
            
            {scannedData && (
              <View style={styles.resultDisplay}>
                <Text style={styles.resultLabel}>條碼內容:</Text>
                <Text style={styles.resultText}>{scannedData}</Text>
                
                {parsedProduct && (
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductInfoTitle}>產品資訊</Text>
                    {parsedProduct.isValid ? (
                      <View style={styles.modalProductInfoTable}>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品類別:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.categoryName} ({parsedProduct.category})</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品代碼:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.productCode}</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>產品名稱:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.productName}</Text>
                        </View>
                        <View style={styles.modalProductInfoRow}>
                          <Text style={styles.modalProductInfoLabel}>生產日期:</Text>
                          <Text style={styles.modalProductInfoValue}>{parsedProduct.formattedDate}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.modalErrorContainer}>
                        <Text style={styles.modalErrorText}>❌ {parsedProduct.error}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.modalCopyButton}
                      onPress={() => {
                        Clipboard.setString(scannedData);
                        Alert.alert('成功', '條碼已複製到剪貼簿！');
                      }}
                    >
                      <Text style={styles.modalCopyButtonText}>📋 複製條碼</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.modalButtons}>
              {!scannedData ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowResultModal(false);
                      setManualInput('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleManualInput}
                  >
                    <Text style={styles.modalButtonConfirmText}>確認</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowResultModal(false);
                      setScannedData('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>清除</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleScanAgain}
                  >
                    <Text style={styles.modalButtonConfirmText}>重新掃描</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 相機掃描 Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          <RNCamera
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.auto}
            onBarCodeRead={onBarcodeRead}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: '相機權限',
              message: '需要相機權限來掃描條碼',
              buttonPositive: '確定',
              buttonNegative: '取消',
            }}
          />
          
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCameraModal(false)}
              >
                <Text style={styles.cameraCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>掃描條碼</Text>
              <View style={styles.cameraPlaceholder} />
            </View>
            
            <View style={styles.scanFrame}>
              {/* 左上角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerTopLeft]} />
              {/* 右上角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerTopRight]} />
              {/* 左下角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomLeft]} />
              {/* 右下角 */}
              <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomRight]} />
            </View>
            
            <View style={styles.cameraFooter}>
              <Text style={styles.cameraInstruction}>
                將條碼對準框內進行掃描
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  scanButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualButton: {
    backgroundColor: '#28a745',
  },
  cameraButton: {
    backgroundColor: '#007bff',
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  resultData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  resultDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalButtonConfirm: {
    backgroundColor: '#007bff',
  },
  modalButtonCancelText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCloseButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraPlaceholder: {
    width: 40,
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 3,
  },
  scanFrameCornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  scanFrameCornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  scanFrameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  scanFrameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraInstruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 8,
  },
  productInfoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  productInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  productInfoTable: {
    gap: 8,
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  productInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  modalProductInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalProductInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  modalProductInfoTable: {
    gap: 6,
  },
  modalProductInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  modalProductInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalProductInfoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  modalErrorContainer: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  modalErrorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  managementSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  managementButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  managementButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  managementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCopyButton: {
    backgroundColor: '#17a2b8',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCopyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default POSSystemScreen; 