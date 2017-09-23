import React from 'react';
import { StackNavigator } from 'react-navigation';
import { StyleSheet, Text, TextInput, ScrollView, ListView, View, Picker, Button, TouchableHighlight, Alert, AsyncStorage } from 'react-native';

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

	let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
	this.state = { conversations: ds.cloneWithRows([]) };
  }
  
  componentDidMount() {
	AsyncStorage.getItem('Conversations').then((value) => {
      let conversations = [];
	  if (value != '') {
		conversations = JSON.parse(value);
	  }
	  let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
	  this.setState({'conversations': ds.cloneWithRows(conversations)});
	}).done();
  }

  render() {
	const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <ListView style={{flexGrow: 1}} dataSource={this.state.conversations} renderRow={this._renderConversation}/>
        <View style={styles.buttonContainer}>
          <Button onPress={() => navigate('New Conversation', {})} title="New" />
        </View>
      </View>
    );
  }
  
  _renderConversation(rowData, sectionID, rowID) {
	return (
  	  <TouchableHighlight onPress={() => this._goToConversation(rowID)}>
	    <View>
	      <View style={styles.row}>
	        <Text style={styles.text}>
	          {rowData.text}
	        </Text>
	      </View>
	    </View>
	  </TouchableHighlight>
	);
  }
  
  _goToConversation() {
    Alert.alert('Going to conversation!')
  }
  
  _removeConversation() {
    Alert.alert('Removing conversation!')
  }
}

class ChatScreen extends React.Component {
  static navigationOptions = {
	title: 'Chat'
  }
  render() {
	const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <View style={{height: 50, margin: 20}}>
          <Text style={{fontSize: 20}}>Chat</Text>
        </View>
        <ScrollView style={{flexGrow: 1}}>
          <Text>Open up App.js to start working on your app!</Text>
          <Text>Changes you make will automatically reload.</Text>
          <Text>Shake your phone to open the developer menu.</Text>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button onPress={this._addConversation} title="Add" />
        </View>
      </View>
    );
  }
  
  _addConversation() {
    Alert.alert('Adding conversation!')
  }
  
  _removeConversation() {
    Alert.alert('Removing conversation!')
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
	const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
        <ScrollView style={{flexGrow: 1, flexDirection: 'column'}}>
          <Text style={styles.spacer}></Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={{margin: 20}} onChangeText={(textValue) => this.setState({text: textValue})} value={this.state.text} />
          <Text style={styles.label}>Your Language</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language1} onValueChange={(itemValue, itemIndex) => this.setState({language1: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (traditional)" value="cn" />
          </Picker>
          <Text style={styles.label}>Translated Language</Text>
          <Picker style={{margin: 20}} selectedValue={this.state.language2} onValueChange={(itemValue, itemIndex) => this.setState({language2: itemValue})}>
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Chinese (traditional)" value="cn" />
          </Picker>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button onPress={ () => this._saveConversations(navigate).done()} title="Add" />
        </View>
      </View>
    );
  }
  
  async _saveConversations(navigate) {
    try { 
	  AsyncStorage.getItem('Conversations').then((value) => {
        let conversations = [];
		if (value != '') {
		  conversations = JSON.parse(value);
		}
		conversations.push(this.state);
		AsyncStorage.setItem('Conversations', JSON.stringify(conversations)).done(); 
	  }).done();
	  navigate('Conversations', {}); 
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
	margin: 20
  },
  row: {
	flexDirection: 'row',
	justifyContent: 'center',
	padding: 10,
  },
  text: {
	flex: 1
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
});

