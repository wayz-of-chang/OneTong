import React from 'react';
import LocalizationStrings from 'react-native-localization';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { StackNavigator } from 'react-navigation';
import { StyleSheet, Text, TextInput, FlatList, ScrollView, View, Picker, Button, StatusBar, TouchableHighlight, Alert, AsyncStorage, Platform } from 'react-native';
import * as GLOBAL from './Globals';

export default class App extends React.Component {
  render() {
    return (
      <AppNavigator ref={nav => { this.navigator = nav; }} />
	);
  }
}

class ConversationList extends React.Component {
  static navigationOptions = {
	title: 'Conversations'
  }
  
  constructor(props) {
	super(props);

	this.state = { conversations: [] };
  }
  
  componentDidMount() {
	this._updateConversations()
  }

  render() {
	const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <FlatList style={{flexGrow: 1}} data={this.state.conversations} renderItem={this._renderConversation.bind(this)} enableEmptySections={true} keyExtractor={(item, index) => {return index}}/>
        <View style={styles.buttonContainer}>
          <Button onPress={() => navigate('New Conversation', {_updateConversations: this._updateConversations.bind(this)})} title="New" />
        </View>
      </View>
    );
  }
  
  _renderConversation(rowData) {
	let item = rowData.item
	return (
  	  <TouchableHighlight onPress={() => this._goToConversation(item)}>
	    <View>
	      <View style={styles.row}>
	        <Text style={styles.text}>
	          {item.text}
	        </Text>
	      </View>
	    </View>
	  </TouchableHighlight>
	);
  }
  
  _goToConversation(row) {
	const { navigate } = this.props.navigation;
	navigate('Chat', row);
  }
  
  _updateConversations() {
	AsyncStorage.getItem('Conversations').then((value) => {
      let conversations = [];
	  if (value != '' && value != null) {
		conversations = JSON.parse(value);
	  }
	  this.setState({'conversations': conversations});
	}).done();
  }
  
  _removeConversation() {
    Alert.alert('Removing conversation!')
  }
}

class ChatScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
	const {params = {}} = navigation.state;
	return {
	  title: navigation.state.params.text,
	  headerRight: <View style={{marginRight: 20, flexDirection: 'row'}}><Text>{params.selectedLanguage == 1 ? params.language1 : params.language2}</Text><Button title="Switch" onPress={() => params._switchLanguage()} /></View>
	}
  }
  
  constructor(props) {
	super(props);

	this.state = props.navigation.state.params;
	this.state.input = '';
	this.state.selectedLanguage = 1;
  }
  
  componentWillMount() {
	this.props.navigation.setParams({
	  _switchLanguage: this._switchLanguage.bind(this),
	  selectedLanguage: this.state.selectedLanguage
	});
  }
  
  componentDidMount() {
	AsyncStorage.getItem('Chat.'+this.state.text).then((value) => {
      let source = [];
	  if (value != '' && value != null) {
		source = JSON.parse(value);
	  }
	  this.setState({'source': source});
	}).done();
  }

  render() {
	const { navigate } = this.props.navigation;
    return (
      <ScrollView style={{flex: 1, flexDirection: 'column'}}>
        <FlatList style={{flex: 1}} data={this.state.source} extraData={this.state.selectedLanguage} renderItem={this._renderChat.bind(this)} enableEmptySections={true} ref="listView" keyExtractor={(item, index) => {return index}}/>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} autoFocus={true} onChangeText={(input) => this.setState({input})} onSubmitEditing={this._sendMessage.bind(this)} value={this.state.input} />
          <Button onPress={this._sendMessage.bind(this)} title={strings.send} />
        </View>
        <KeyboardSpacer/>
      </ScrollView>
    );
  }
  
  _renderChat(rowData) {
	let item = rowData.item
	return (
  	  <TouchableHighlight onPress={() => true}>
	    <View>
	      <View style={styles.row}>
	        <Text style={styles.text}>
	          {this.state.selectedLanguage == item.language ? item.text : item.translated}
	        </Text>
	      </View>
	    </View>
	  </TouchableHighlight>
	);
  }
  
  _sendMessage() {
	let request = {
	  'q': this.state.input,
	  'source': this.state.selectedLanguage == 1 ? this.state.language1 : this.state.language2,
	  'target': this.state.selectedLanguage == 1 ? this.state.language2 : this.state.language1,
	  'format': 'text'
	}
	fetch('https://translation.googleapis.com/language/translate/v2?key=' + GLOBAL.API_KEY, {
	  method: 'POST',
	  body: JSON.stringify(request)
	}).then((response) => {
	  let data = JSON.parse(response._bodyText)
	  if (data.data != undefined && data.data.translations != undefined) {
		data = data.data.translations[0].translatedText
	  } else {
		data = ''
	  }
      this.state.source = this.state.source.concat([{text: this.state.input, language: this.state.selectedLanguage, translated: data}])
      AsyncStorage.setItem('Chat.'+this.state.text, JSON.stringify(this.state.source)).done()
      this.refs.listView.scrollToEnd()
      this._switchLanguage()
	  return data
	}).catch((error) => {
	  console.error(error)
	}).done()
  }
  
  _switchLanguage() {
	this.state.selectedLanguage == 1 ? this.state.selectedLanguage = 2 : this.state.selectedLanguage = 1
	this.props.navigation.setParams({
	  selectedLanguage: this.state.selectedLanguage
	});
	this.setState({ input: '' })
  }
}

class AddConversation extends React.Component {
  static navigationOptions = {
	title: 'New Conversation'
  }
  constructor(props) {
	super(props);
	this.state = { text: '', language1: 'en', language2: 'en' };
  }
  render() {
	const { goBack, state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <ScrollView style={{flex: 1, flexDirection: 'column'}}>
          <Text style={styles.spacer}></Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={{margin: 20}} onChangeText={(textValue) => this.setState({text: textValue})} value={this.state.text} />
          <Text style={styles.label}>Your Language</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language1} onValueChange={(itemValue, itemIndex) => this.setState({language1: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (Simplified)" value="zh-CN" />
            <Picker.Item label="Chinese (Traditional)" value="zh-TW" />
            <Picker.Item label="Czech" value="cs" />
            <Picker.Item label="Dutch" value="nl" />
            <Picker.Item label="French" value="fr" />
            <Picker.Item label="German" value="de" />
            <Picker.Item label="Hindi" value="hi" />
            <Picker.Item label="Italian" value="it" />
            <Picker.Item label="Japanese" value="ja" />
            <Picker.Item label="Korean" value="ko" />
            <Picker.Item label="Nepali" value="ne" />
            <Picker.Item label="Polish" value="pl" />
            <Picker.Item label="Portuguese" value="pt" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="Tagalog" value="tl" />
            <Picker.Item label="Thai" value="th" />
            <Picker.Item label="Vietnamese" value="vi" />
          </Picker>
          <Text style={styles.label}>Translated Language</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language2} onValueChange={(itemValue, itemIndex) => this.setState({language2: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (Simplified)" value="zh-CN" />
            <Picker.Item label="Chinese (Traditional)" value="zh-TW" />
            <Picker.Item label="Czech" value="cs" />
            <Picker.Item label="Dutch" value="nl" />
            <Picker.Item label="French" value="fr" />
            <Picker.Item label="German" value="de" />
            <Picker.Item label="Hindi" value="hi" />
            <Picker.Item label="Italian" value="it" />
            <Picker.Item label="Japanese" value="ja" />
            <Picker.Item label="Korean" value="ko" />
            <Picker.Item label="Nepali" value="ne" />
            <Picker.Item label="Polish" value="pl" />
            <Picker.Item label="Portuguese" value="pt" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="Tagalog" value="tl" />
            <Picker.Item label="Thai" value="th" />
            <Picker.Item label="Vietnamese" value="vi" />
          </Picker>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button onPress={ () => this._saveConversations(goBack, state).done()} title="Add" />
        </View>
        <KeyboardSpacer/>
      </View>
    );
  }
  
  async _saveConversations(goBack, state) {
    try { 
	  AsyncStorage.getItem('Conversations').then((value) => {
        let conversations = [];
		if (value != '' && value != null) {
		  conversations = JSON.parse(value);
		}
		conversations.push(this.state);
		AsyncStorage.setItem('Conversations', JSON.stringify(conversations)).done(); 
	  }).then(() => {
        state.params._updateConversations();
	    goBack();
	  }).done();
	} catch (error) { 
	  Alert.alert ('Could not add new conversation'); 
	}
  }
  
  _removeConversation() {
    Alert.alert('Removing conversation!')
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  buttonContainer: {
	margin: 10
  },
  inputContainer: {
	flex: 0,
	flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
	padding: 10
  },
  row: {
	flexDirection: 'row',
	justifyContent: 'center',
    backgroundColor: '#fff',
	padding: 10,
	margin: 5
  },
  text: {
	flex: 1
  },
  input: {
	flex: 1
  },
  inputSubmit: {
	flex: 0
  },
  label: {
	marginLeft: 20,
	marginRight: 20,
	fontWeight: 'bold'
  },
  spacer: {
	margin: 20
  }
});

const AppNavigator = StackNavigator({
  Conversations: { screen: ConversationList },
  Chat: { screen: ChatScreen },
  "New Conversation": { screen: AddConversation }
},{
  cardStyle: {
	paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight
  }
});

const strings = new LocalizationStrings({
  en: {
	send: "Send"
  }
});
