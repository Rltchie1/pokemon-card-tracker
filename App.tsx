import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import type { CollectionItem, PokemonCard } from './src/types';
import { getMarketPrice, searchPokemonCards } from './src/lib/pokemonApi';

type Screen = 'search' | 'details' | 'add' | 'collection';

const CONDITIONS = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged', 'Graded'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [frontPhotoUri, setFrontPhotoUri] = useState<string | undefined>();
  const [backPhotoUri, setBackPhotoUri] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);

  const estimatedValue = useMemo(() => {
    return collection.reduce((total, item) => total + (getMarketPrice(item.card) ?? 0) * item.quantity, 0);
  }, [collection]);

  async function runSearch() {
    setIsSearching(true);
    try {
      setResults(await searchPokemonCards(query));
    } catch (error) {
      Alert.alert('Search failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSearching(false);
    }
  }

  function openCard(card: PokemonCard) {
    setSelectedCard(card);
    setScreen('details');
  }

  function startAddCard(card: PokemonCard) {
    setSelectedCard(card);
    setQuantity('1');
    setCondition(CONDITIONS[0]);
    setPurchasePrice('');
    setNotes('');
    setFrontPhotoUri(undefined);
    setBackPhotoUri(undefined);
    setScreen('add');
  }

  async function pickPhoto(type: 'front' | 'back') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add card pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      if (type === 'front') setFrontPhotoUri(result.assets[0].uri);
      if (type === 'back') setBackPhotoUri(result.assets[0].uri);
    }
  }

  function saveCard() {
    if (!selectedCard) return;

    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      Alert.alert('Invalid quantity', 'Quantity must be at least 1.');
      return;
    }

    const item: CollectionItem = {
      id: `${selectedCard.id}-${Date.now()}`,
      card: selectedCard,
      quantity: parsedQuantity,
      condition,
      purchasePrice: purchasePrice ? Number.parseFloat(purchasePrice) : undefined,
      notes,
      frontPhotoUri,
      backPhotoUri,
      createdAt: new Date().toISOString(),
    };

    setCollection((current) => [item, ...current]);
    setScreen('collection');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon Card Tracker</Text>
        <Text style={styles.subtitle}>Track cards, photos, condition, and value.</Text>
      </View>

      <View style={styles.tabs}>
        <Tab label="Search" active={screen === 'search'} onPress={() => setScreen('search')} />
        <Tab label="Collection" active={screen === 'collection'} onPress={() => setScreen('collection')} />
      </View>

      {screen === 'search' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Find a card</Text>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Try Charizard or Blastoise" />
          <Button label={isSearching ? 'Searching...' : 'Search cards'} onPress={runSearch} />

          {results.map((card) => (
            <CardRow key={card.id} card={card} onPress={() => openCard(card)} />
          ))}
        </ScrollView>
      )}

      {screen === 'details' && selectedCard && (
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={{ uri: selectedCard.images?.large ?? selectedCard.images?.small }} style={styles.heroImage} resizeMode="contain" />
          <Text style={styles.sectionTitle}>{selectedCard.name}</Text>
          <Text style={styles.meta}>{selectedCard.set?.name} • #{selectedCard.number ?? 'N/A'} • {selectedCard.rarity ?? 'Unknown rarity'}</Text>
          <Text style={styles.price}>Market estimate: {formatMoney(getMarketPrice(selectedCard))}</Text>
          <Button label="Add to collection" onPress={() => startAddCard(selectedCard)} />
          <GhostButton label="Back to search" onPress={() => setScreen('search')} />
        </ScrollView>
      )}

      {screen === 'add' && selectedCard && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Add {selectedCard.name}</Text>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />

          <Text style={styles.label}>Condition</Text>
          <View style={styles.conditionGrid}>{CONDITIONS.map((option) => <Chip key={option} label={option} active={condition === option} onPress={() => setCondition(option)} />)}</View>

          <Text style={styles.label}>Purchase price</Text>
          <TextInput style={styles.input} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="Optional" />

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Sleeved, graded, bought at show..." multiline />

          <View style={styles.photoRow}>
            <PhotoBox label="Front photo" uri={frontPhotoUri} onPress={() => pickPhoto('front')} />
            <PhotoBox label="Back photo" uri={backPhotoUri} onPress={() => pickPhoto('back')} />
          </View>

          <Button label="Save card" onPress={saveCard} />
          <GhostButton label="Cancel" onPress={() => setScreen('details')} />
        </ScrollView>
      )}

      {screen === 'collection' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Your collection</Text>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{collection.reduce((sum, item) => sum + item.quantity, 0)}</Text>
            <Text style={styles.statLabel}>Total cards</Text>
            <Text style={styles.statNumber}>{formatMoney(estimatedValue)}</Text>
            <Text style={styles.statLabel}>Estimated market value</Text>
          </View>

          {collection.length === 0 && <Text style={styles.empty}>No cards saved yet. Search for a card to start your collection.</Text>}
          {collection.map((item) => (
            <View key={item.id} style={styles.collectionCard}>
              <CardRow card={item.card} onPress={() => openCard(item.card)} />
              <Text style={styles.meta}>Qty {item.quantity} • {item.condition} • Paid {item.purchasePrice ? formatMoney(item.purchasePrice) : 'N/A'}</Text>
              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
              <View style={styles.photoRow}>
                {item.frontPhotoUri && <Image source={{ uri: item.frontPhotoUri }} style={styles.thumb} />}
                {item.backPhotoUri && <Image source={{ uri: item.backPhotoUri }} style={styles.thumb} />}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></TouchableOpacity>;
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={styles.ghostButton}><Text style={styles.ghostButtonText}>{label}</Text></TouchableOpacity>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.activeChip]}><Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text></TouchableOpacity>;
}

function PhotoBox({ label, uri, onPress }: { label: string; uri?: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={styles.photoBox}>{uri ? <Image source={{ uri }} style={styles.photoPreview} /> : <Text style={styles.photoText}>{label}</Text>}</TouchableOpacity>;
}

function CardRow({ card, onPress }: { card: PokemonCard; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.cardRow}>
      <Image source={{ uri: card.images?.small }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.meta}>{card.set?.name} • #{card.number ?? 'N/A'}</Text>
        <Text style={styles.price}>{formatMoney(getMarketPrice(card))}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatMoney(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fb' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#17171f' },
  subtitle: { marginTop: 4, color: '#626275' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#e8e8ef' },
  activeTab: { backgroundColor: '#17171f' },
  tabText: { color: '#333344', fontWeight: '700' },
  activeTabText: { color: '#ffffff' },
  content: { padding: 20, gap: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#17171f' },
  input: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dfdfea', fontSize: 16 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  label: { fontWeight: '700', color: '#333344' },
  button: { backgroundColor: '#e33535', borderRadius: 14, padding: 15, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  ghostButton: { padding: 14, alignItems: 'center' },
  ghostButtonText: { color: '#55556a', fontWeight: '700' },
  cardRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 18, padding: 12, gap: 12, borderWidth: 1, borderColor: '#ececf4' },
  cardImage: { width: 72, height: 100, borderRadius: 8, backgroundColor: '#eeeeee' },
  cardInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#17171f' },
  meta: { color: '#656579' },
  price: { color: '#1f7a3f', fontWeight: '800' },
  heroImage: { width: '100%', height: 420, backgroundColor: '#ffffff', borderRadius: 20 },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dfdfea' },
  activeChip: { backgroundColor: '#17171f', borderColor: '#17171f' },
  chipText: { color: '#333344', fontWeight: '700' },
  activeChipText: { color: '#ffffff' },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBox: { flex: 1, height: 150, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dfdfea' },
  photoText: { color: '#656579', fontWeight: '700' },
  photoPreview: { width: '100%', height: '100%', borderRadius: 18 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#ececf4' },
  statNumber: { fontSize: 28, fontWeight: '900', color: '#17171f' },
  statLabel: { color: '#656579', marginBottom: 12 },
  empty: { color: '#656579', lineHeight: 22 },
  collectionCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#ececf4', gap: 8 },
  notes: { color: '#333344', lineHeight: 20 },
  thumb: { width: 86, height: 120, borderRadius: 12, backgroundColor: '#eeeeee' }
});
